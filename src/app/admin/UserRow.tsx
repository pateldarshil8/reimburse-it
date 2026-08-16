"use client";

import { useActionState } from "react";
import { updateUserRole, setAccountStatus, type AdminActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const initialState: AdminActionState = {};

type Props = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: Date;
  isSelf: boolean;
};

export function UserRow({ id, name, email, role, accountStatus, createdAt, isSelf }: Props) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRole.bind(null, id),
    initialState
  );
  const nextStatus = accountStatus === "active" ? "inactive" : "active";
  const [statusState, statusAction, statusPending] = useActionState(
    setAccountStatus.bind(null, id, nextStatus),
    initialState
  );

  return (
    <tr className="border-b border-neutral-200 last:border-0">
      <td className="py-3 pr-4 align-top">
        <p className="font-medium">{name}</p>
        <p className="text-xs text-neutral-500">{email}</p>
        <p className="text-xs text-neutral-400">Joined {formatDate(createdAt)}</p>
      </td>
      <td className="py-3 pr-4 align-top">
        {isSelf ? (
          <Badge variant="secondary">{role}</Badge>
        ) : (
          <form action={roleAction} className="flex flex-col gap-1">
            <select
              name="role"
              defaultValue={role}
              className="flex h-8 w-32 rounded-md border border-neutral-300 bg-white px-2 text-sm shadow-sm"
            >
              <option value="employee">employee</option>
              <option value="reviewer">reviewer</option>
              <option value="admin">admin</option>
            </select>
            <Button type="submit" size="sm" variant="outline" disabled={rolePending}>
              {rolePending ? "Saving..." : "Update role"}
            </Button>
            {roleState.error && <p className="text-xs text-red-600">{roleState.error}</p>}
          </form>
        )}
      </td>
      <td className="py-3 pr-4 align-top">
        <Badge variant={accountStatus === "active" ? "success" : "destructive"}>
          {accountStatus}
        </Badge>
      </td>
      <td className="py-3 align-top">
        {isSelf ? (
          <span className="text-xs text-neutral-400">-</span>
        ) : (
          <form action={statusAction}>
            <Button
              type="submit"
              size="sm"
              variant={accountStatus === "active" ? "destructive" : "outline"}
              disabled={statusPending}
            >
              {statusPending
                ? "Saving..."
                : accountStatus === "active"
                  ? "Deactivate"
                  : "Activate"}
            </Button>
            {statusState.error && <p className="text-xs text-red-600">{statusState.error}</p>}
          </form>
        )}
      </td>
    </tr>
  );
}
