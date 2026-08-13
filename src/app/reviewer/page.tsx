import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Review queue</h1>
        <p className="text-sm text-neutral-500">
          Approve, reject, or complete submitted requests.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Day 2</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-500">
          Queue of submitted requests with approve/reject actions here.
        </CardContent>
      </Card>
    </div>
  );
}
