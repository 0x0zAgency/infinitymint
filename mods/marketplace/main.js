import Controller from 'infinitymint-client/dist/src/classic/controller';
import NavigationLink from '../../../Components/NavigationLink';
import { Alert, Card } from 'react-bootstrap';

const Marketplace = {
    getViewTokenSidebarChildren: async ({ token }) => {
        return (
            <Card body className="bg-light" key="marketplace_link">
                {token.owner !== Controller.accounts[0] ? (
                    <Alert variant="info" className="text-center mb-0">
                        <p
                            className="fs-2"
                            style={{ color: 'black !important' }}
                        >
                            💰
                        </p>
                        <p className="text-white">
                            Do you like this token? Well, why not send the owner
                            an offer? You might be able to own it!
                        </p>
                    </Alert>
                ) : (
                    <></>
                )}
                <div className="d-grid mt-3">
                    <p className="text-center display-5">♾Market</p>
                    <NavigationLink
                        location={'/offers/' + token.tokenId}
                        size="md"
                        disabled={!Controller.isWalletValid}
                        variant="primary"
                    >
                        💰 Offers{' '}
                        <span className="badge bg-light">
                            {token?.offers?.length || 0}
                        </span>
                    </NavigationLink>
                </div>
            </Card>
        );
    },
    initialize: async () => {
        console.log('Marketplace Functionality Enabled');
    },
};

export default Marketplace;
