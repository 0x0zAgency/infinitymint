import controller from 'infinitymint-client/dist/src/classic/controller';
import { Card, Alert } from 'react-bootstrap';
import NavigationLink from '../../../Components/NavigationLink';
const ContentLinks = {
    getViewTokenSidebarChildren: async ({ token }) => {
        let normal = (
            <>
                <Card
                    body
                    key="content_links_card"
                    className="bg-light"
                    hidden={token.owner !== controller.accounts[0]}
                >
                    <p className="text-center display-5">♾Links</p>
                    <p className="text-center">
                        This token has some cool content attached to it!
                    </p>
                    <div className="d-grid">
                        <NavigationLink
                            location={'/view/' + token.tokenId + '/content'}
                            text={'View ♾Content'}
                            size="md"
                            variant="dark"
                        />
                    </div>
                </Card>
            </>
        );

        if (!controller.isWalletValid)
            return (
                <Alert variant="danger">Please connect your wallet...</Alert>
            );

        try {
            return <>{normal}</>;
        } catch (error) {
            controller.log(error);
            return (
                <>
                    <Alert variant="danger">Error</Alert>
                </>
            );
        }
    },

    onLink: async (link) => {},
    /**
     *
     * @param {Controller} param0
     */
    initialize: async () => {},
};

export default ContentLinks;
