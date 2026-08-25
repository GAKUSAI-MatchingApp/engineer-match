import { JOB_MANAGEMENT_META } from "@/constants/company-jobs";

export function JobManagementHeader() {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {JOB_MANAGEMENT_META.title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {JOB_MANAGEMENT_META.description}
      </p>
    </div>
  );
}
