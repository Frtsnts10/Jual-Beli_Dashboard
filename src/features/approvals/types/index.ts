export type DraftRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DraftRequestType = "CREATE" | "UPDATE" | "DELETE";

export interface DraftRequest {
  id: string;
  store_id: string;
  type: DraftRequestType;
  target_collection: string; // e.g., "inventory"
  target_id: string | null; // null for CREATE
  payload: Record<string, any>; // the JSON payload of the requested change
  status: DraftRequestStatus;
  proposed_by: {
    uid: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at?: string;
  rejection_reason?: string;
}
