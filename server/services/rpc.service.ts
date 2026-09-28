import { config } from "../utils/utils";

export interface AliasDetails {
    address: string;
    alias: string;
    comment: string;
    tracking_key: string;
}

class RPCService {

    private async fetchDaemon(method: string, params: object) {
        const result = await fetch(config.api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "id": 0,
                "jsonrpc": "2.0",
                "method": method,
                "params": params
            })
        }).then(res => res.json()).catch(err => {
            console.log(err);
            return null;
        });

        return result?.result;
    }

    async getAllAliasesDetails() {
        const allAliases = await this.fetchDaemon("get_all_alias_details", {});

        if (!allAliases?.aliases || !Array.isArray(allAliases.aliases)) {
            throw new Error("Failed to fetch aliases from daemon");
        }

        return allAliases.aliases as AliasDetails[];

    }
}

const rpcService = new RPCService();

export default rpcService;