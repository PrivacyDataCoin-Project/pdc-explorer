/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('assets', 'logo', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'price_url', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'ticker', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'full_name', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'total_max_supply', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'current_supply', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.changeColumn('assets', 'meta_info', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('assets', 'logo', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'price_url', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'ticker', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'full_name', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'total_max_supply', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'current_supply', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.changeColumn('assets', 'meta_info', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    }
};