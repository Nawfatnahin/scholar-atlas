"""
JARVIS — Code Skeletonizer Engine
Parses source files (Python, TypeScript, JavaScript, React/Next.js)
and extracts a compact structural map (exports, classes, interfaces, and function signatures)
to drastically minimize context token usage during codebase reasoning.
Usage: py skeletonizer.py <file_path>
"""

import os
import sys
import re
import ast

def skeletonize_python(content: str) -> str:
    """Parse Python code using AST and extract class/function signatures with docstrings."""
    try:
        tree = ast.parse(content)
        lines = []
        
        class ASTVisitor(ast.NodeVisitor):
            def __init__(self):
                self.indent_level = 0
            
            def _indent(self) -> str:
                return "  " * self.indent_level
            
            def visit_ClassDef(self, node: ast.ClassDef):
                lines.append(f"{self._indent()}class {node.name}:")
                # Docstring
                docstring = ast.get_docstring(node)
                if docstring:
                    lines.append(f'{self._indent()}  """{docstring.splitlines()[0]}"""')
                
                self.indent_level += 1
                self.generic_visit(node)
                self.indent_level -= 1
                
            def visit_FunctionDef(self, node: ast.FunctionDef):
                # Format parameters
                args = []
                for arg in node.args.args:
                    arg_str = arg.arg
                    if arg.annotation:
                        ann = ast.unparse(arg.annotation) if hasattr(ast, "unparse") else "Any"
                        arg_str += f": {ann}"
                    args.append(arg_str)
                
                # Check for *args and **kwargs
                if node.args.vararg:
                    args.append(f"*{node.args.vararg.arg}")
                if node.args.kwarg:
                    args.append(f"**{node.args.kwarg.arg}")
                
                params = ", ".join(args)
                ret_ann = ""
                if node.returns and hasattr(ast, "unparse"):
                    ret_ann = f" -> {ast.unparse(node.returns)}"
                
                lines.append(f"{self._indent()}def {node.name}({params}){ret_ann}:")
                docstring = ast.get_docstring(node)
                if docstring:
                    lines.append(f'{self._indent()}  """{docstring.splitlines()[0]}"""')
            
            def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
                # Async functions
                args = [arg.arg for arg in node.args.args]
                params = ", ".join(args)
                lines.append(f"{self._indent()}async def {node.name}({params}):")
                docstring = ast.get_docstring(node)
                if docstring:
                    lines.append(f'{self._indent()}  """{docstring.splitlines()[0]}"""')

        visitor = ASTVisitor()
        visitor.visit(tree)
        return "\n".join(lines) if lines else "# No classes or functions found."
    except Exception as e:
        return f"# Failed to parse Python AST: {e}"

def skeletonize_web(content: str) -> str:
    """Parse TypeScript/JavaScript files and extract interfaces, types, exports, and functions using regex."""
    lines = []
    
    # Matches export interfaces or types
    interface_pattern = re.compile(r'export\s+(interface|type)\s+(\w+)\s*[{=]')
    # Matches export functions (including default and async)
    func_pattern = re.compile(r'export\s+(default\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)')
    # Matches arrow function exports: export const name = (...) =>
    arrow_pattern = re.compile(r'export\s+const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>')
    # Matches custom hook definitions: export function useX(...)
    hook_pattern = re.compile(r'export\s+function\s+(use\w+)\s*\(([^)]*)\)')
    
    content_lines = content.splitlines()
    i = 0
    while i < len(content_lines):
        line = content_lines[i].strip()
        
        # Skip import statements to reduce noise
        if line.startswith("import ") or line.startswith("import{") or line.startswith("} from"):
            i += 1
            continue
            
        # Match interface or type
        int_match = interface_pattern.match(line)
        if int_match:
            kind, name = int_match.groups()
            lines.append(f"export {kind} {name} {{")
            # Pull body lines until closing brace (approximate)
            brace_count = line.count("{") - line.count("}")
            j = i + 1
            while j < len(content_lines) and brace_count > 0:
                body_line = content_lines[j].strip()
                if "{" in body_line:
                    brace_count += body_line.count("{")
                if "}" in body_line:
                    brace_count -= body_line.count("}")
                # Log members of interface briefly
                if body_line and not body_line.startswith("//"):
                    lines.append(f"  {body_line}")
                j += 1
            lines.append("}")
            i = j
            continue

        # Match export functions
        func_match = func_pattern.match(line)
        if func_match:
            default_pref, is_async, name, params = func_match.groups()
            default_pref = default_pref if default_pref else ""
            is_async = is_async if is_async else ""
            clean_params = ", ".join([p.strip() for p in params.split(",") if p.strip()])
            lines.append(f"export {default_pref}{is_async}function {name}({clean_params})")
            i += 1
            continue

        # Match arrow functions
        arrow_match = arrow_pattern.match(line)
        if arrow_match:
            name, params = arrow_match.groups()
            clean_params = ", ".join([p.strip() for p in params.split(",") if p.strip()])
            lines.append(f"export const {name} = ({clean_params}) => ...")
            i += 1
            continue

        # Match hook functions
        hook_match = hook_pattern.match(line)
        if hook_match:
            name, params = hook_match.groups()
            clean_params = ", ".join([p.strip() for p in params.split(",") if p.strip()])
            lines.append(f"export function {name}({clean_params})")
            i += 1
            continue

        i += 1

    return "\n".join(lines) if lines else "// No exports, interfaces, or functions detected."

def skeletonize(filepath: str) -> str:
    """Read a file and generate its high-density skeleton."""
    if not os.path.exists(filepath):
        return f"Error: File not found: {filepath}"
        
    _, ext = os.path.splitext(filepath)
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        return f"Error: Could not read file: {e}"

    header = f"// =========================================================\n"
    header += f"// SKELETON: {os.path.basename(filepath)} ({ext.upper()})\n"
    header += f"// =========================================================\n"

    if ext == ".py":
        return header + skeletonize_python(content)
    elif ext in [".ts", ".tsx", ".js", ".jsx"]:
        return header + skeletonize_web(content)
    else:
        # Fallback for other file types
        return header + f"// Unsupported file extension for structural parsing: {ext}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py skeletonizer.py <file_path>")
        sys.exit(1)
        
    path = sys.argv[1]
    print(skeletonize(path))
