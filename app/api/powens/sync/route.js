import { NextResponse } from "next/server";
import { powensCookieName, powensFetch, sameState, unsealPowensSession } from "@/lib/powens.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = unsealPowensSession(request.cookies.get(powensCookieName())?.value);
    const state = new URL(request.url).searchParams.get("state");
    if (!session || !sameState(session.state, state)) {
      return NextResponse.json({ erreur: "Session bancaire expirée. Relance la connexion depuis Pécule." }, { status: 401 });
    }

    const [accountsResponse, transactionsResponse] = await Promise.all([
      powensFetch("/users/me/accounts?all", { token: session.token }),
      powensFetch("/users/me/transactions?limit=1000", { token: session.token }).catch(() => ({ transactions: [] })),
    ]);
    const accounts = (accountsResponse.accounts || []).filter((account) => !account.disabled && !account.deleted).map((account) => ({
      id: account.id,
      name: account.name || account.original_name || "Compte bancaire",
      balance: Number(account.balance || 0),
      currency: account.currency?.id || "EUR",
      type: account.type?.name || account.type?.code || null,
      lastUpdate: account.last_update || null,
    }));
    const accountIds = new Set(accounts.map((account) => account.id));
    const transactions = (transactionsResponse.transactions || []).filter((transaction) => accountIds.has(transaction.id_account)).map((transaction) => ({
      id: transaction.id,
      accountId: transaction.id_account,
      amount: Number(transaction.value || 0),
      date: transaction.application_date || transaction.date,
      label: transaction.wording || transaction.simplified_wording || transaction.original_wording || "Opération bancaire",
      coming: Boolean(transaction.coming),
    }));
    return NextResponse.json({ accounts, transactions });
  } catch (error) {
    console.error("Powens sync:", error);
    return NextResponse.json({ erreur: "La banque synchronise encore ses données. Réessaie dans quelques instants." }, { status: 502 });
  }
}
