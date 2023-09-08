import { Card, Button } from 'react-bootstrap';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import NavigationLink from '../../../Components/NavigationLink';

const Config = Controller.getConfig();
const Drink = {
    /**
     *
     * @param {Controller} param0
     */
    initialize: async () => {
        let deployment = Config.getDeployment('Mod_Drink');
        Controller.initializeContract(deployment.address, 'Mod_Drink', true);
    },

    getViewTokenSidebarChildren: ({ token }) => {
        let isFull = Controller.callMethod(
            Controller.accounts[0],
            'Mod_Drink',
            'isDrinkFull',
            [token.tokenId]
        );

        return (
            <Card body className="bg-light" key="Drink_Club_Key">
                <div className="d-grid">
                    <p className="text-center display-5">🥃Club.eth</p>
                    <NavigationLink
                        location={'/view/' + token.tokenId + '/drink'}
                    >
                        {isFull ? 'Join the 🥃Club' : 'Re-Fill your Drink'}
                    </NavigationLink>
                </div>
            </Card>
        );
    },
};

export default Drink;
