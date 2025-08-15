import { Client, SetActivity } from "@xhayper/discord-rpc";

let client: Client | null = null;

export async function init(clientId: string) {
    if (client) return true;
    client = new Client({
        clientId: clientId
    });

    client!.login();

    return new Promise((resolve) => {
        client!.once("ready", () => {
            resolve(true);
        });
    });
}

export function setActivity(data: SetActivity) {
    if (!client) return false;
    client!.user?.setActivity(data);
    return true;
}

export function removeActivity() {
    if (!client) return false;
    client!.user?.setActivity({});
    return true;
}

export async function getImageKeys() {
    if (!client) return null;
    const assets = await fetch(`https://discord.com/api/v9/oauth2/applications/${client.clientId}/assets?nocache=true`)
        .catch(() => null)

    if (!assets?.ok) return null;

    const data = await assets.json().catch(() => null) as {
        id: string,
        type: number,
        name: string,
    }[] | null

    if (!data) return null;

    return data.map((asset) => asset.name);
}