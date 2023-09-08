import { call } from "infinitymint-client/dist/src/classic/helpers";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Loading from "../../../../Components/Loading";
import { Container, Row, Col, Alert } from "react-bootstrap";
import NavigationLink from "../../../../Components/NavigationLink";

class ViewBet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameId: props.match.params.gameId,
      game: {},
      loading: true,
      valid: false,
    };
  }

  async componentDidMount() {
    try {
      let game = await call("Mod_HouseOracle", "games", this.state.gameId);

      this.setState({ game, loading: false, valid: game.valid });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    return (
      <>
        {this.state.loading ? (
          <Container>
            <Loading />
          </Container>
        ) : (
          <>
            {this.state.valid ? (
              <>
                <Container className="pt-4">
                  <Row>
                    <Col className="text-center">
                      <h1 className="text-black">🛠️ Viewing Bet</h1>
                      <p className="fs-6 text-white">Text or some shit</p>
                    </Col>
                  </Row>
                </Container>
              </>
            ) : (
              <>
                <Container className="pt-4">
                  <Row>
                    <Col className="text-center">
                      <h1 className="text-black">🛠️ Invalid Bet</h1>
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col>
                      <Alert variant="danger" className="text-center">
                        We could not find the bet you are looking for. Please
                        check the URL and try again.
                      </Alert>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <div className="d-grid">
                        <NavigationLink location={"/bets"}>Back</NavigationLink>
                      </div>
                    </Col>
                  </Row>
                </Container>
              </>
            )}
          </>
        )}
      </>
    );
  }
}

ViewBet.url = "/bets/:gameId";
ViewBet.id = "ViewBet";
ViewBet.settings = {
  requireWallet: true,
  requireWeb3: true,
};

export default withRouter(ViewBet);
