import controller from 'infinitymint-client/dist/src/classic/controller';

const ContentLinks = {
    onLink: async (link) => {},
     /**
     *
     * @param {Controller} param0
     */
     initialize: async () => {
        let deployment = controller.getConfig().getDeployment('Mod_FlagManager');
        controller.initializeContract(deployment.address, 'Mod_FlagManager', true);
    },
};

export default ContentLinks;
