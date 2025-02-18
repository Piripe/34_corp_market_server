export enum account_event_type {
    "deposit",
    "get",
    "credit",
    "debit",
    "purchase",
    "creditFromSeller"
}

export function sanityzeStringToSQL(str: string) {
    return str.replace(/\"/g, '\\"');
}

export function sanityzeObjectStringToSQL(obj: any) {
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") obj[key] = sanityzeStringToSQL(value);
        else if (typeof value === "object") obj[key] = sanityzeObjectStringToSQL(value);
    }

    return obj;
}
