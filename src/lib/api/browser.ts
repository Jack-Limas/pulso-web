"use client";

import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { AdminService } from "@/gen/pulso/v1/admin_service_pb";
import { BankAccountService } from "@/gen/pulso/v1/bank_account_service_pb";
import { InsightsService } from "@/gen/pulso/v1/insights_service_pb";
import { StatementService } from "@/gen/pulso/v1/statement_service_pb";

// Binary protobuf through our own origin: the BFF route adds the token and forwards it.
const transport = createConnectTransport({ baseUrl: "/api/rpc", useBinaryFormat: true });

export const api = {
  bankAccounts: createClient(BankAccountService, transport),
  statements: createClient(StatementService, transport),
  insights: createClient(InsightsService, transport),
  admin: createClient(AdminService, transport),
};
