import sequelize from "../database/sequelize";
import Alias from "../schemes/Alias";
import rpcService from "./rpc.service";

class SyncService {
    async syncAliases() {
        console.log('fetching all alias details from daemon...');
        const allAliases = await rpcService.getAllAliasesDetails();
        console.log(`Fetched ${allAliases.length} aliases from daemon.`);

        const preparedData = allAliases.map(e => ({
            alias: e.alias,
            address: e.address,
            comment: e.comment,
            tracking_key: e.tracking_key,
            block: null,
            transaction: null,
            enabled: 1
        }));

        await sequelize.transaction(async (t) => {
            await Alias.destroy({ where: {}, transaction: t });
            await Alias.bulkCreate(preparedData, { transaction: t });
        });
    }

    async startSyncDaemon() {
        (async () => {
            while (true) {
                try {
                    await this.syncAliases();
                } catch (error) {
                    console.log(error);
                }

                await new Promise(resolve => setTimeout(resolve, 20000));
            }
        })();
    }
}

const syncService = new SyncService();

export default syncService;