"use client";
import type { ResourceLink } from "@/types/resources";
import ResourceCard from "@/components/resources/ResourceCard";

interface Props {
  subjects: { id: string; name: string; color: string }[];
  initialResources: ResourceLink[];
}

export default function ResourcesClient({ subjects, initialResources }: Props) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Subject Resources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialResources.length === 0 ? (
          <p className="text-gray-500">No resources found.</p>
        ) : (
          initialResources.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))
        )}
      </div>
    </div>
  );
}
