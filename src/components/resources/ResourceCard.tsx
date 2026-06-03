"use client";
import { RESOURCE_ICONS } from "@/lib/resourceUtils";
import type { ResourceLink } from "@/types/resources";
import { deleteResourceLink } from "@/app/dashboard/resources/actions";

interface Props {
  resource: ResourceLink;
}

export default function ResourceCard({ resource }: Props) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-gray-200
                    dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 hover:shadow-sm
                    transition-all">
      <span className="text-xl shrink-0">{RESOURCE_ICONS[resource.type]}</span>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0"
      >
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          {resource.title}
        </p>
        <p className="text-xs text-gray-400 truncate">{resource.url}</p>
      </a>
      <button
        onClick={() => deleteResourceLink(resource.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600
                   text-xs transition-opacity shrink-0"
        aria-label="Delete"
      >
        ✕
      </button>
    </div>
  );
}
