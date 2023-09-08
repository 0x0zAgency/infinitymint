import { call } from "infinitymint-client/dist/src/classic/helpers";
import React, { Component } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Loading from "../../../../Components/Loading";

class AdminBets extends Component {
  constructor(props) {
    super(props);

    this.state = {
      games: {},
      loading: true,
    };
  }

  async componentDidMount() {
    let activeGameCount = await call("Mod_HouseOracle", "getActiveGameCount");
    let games = {};

    for (let game of activeGameCount) {
      let gameId = await call("Mod_HouseOracle", "activeGames", game);
      let gameData = await call("Mod_HouseOracle", "games", gameId);
      games[game] = gameData;
    }

    this.setState({ games, loading: false });
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
            <Container className="pt-4">
              <Row>
                <Col className="text-center">
                  <h1 className="text-black">🛠️ Bets</h1>
                  <p className="fs-6 text-white">
                    Here you can see all the games available and update their
                    uri.
                  </p>
                </Col>
              </Row>
            </Container>
          </>
        )}
      </>
    );
  }
}
AdminBets.url = "/admin/bets";
AdminBets.id = "AdminBets";
AdminBets.settings = {
  requireWallet: true,
  requireWeb3: true,
  requireAdmin: true,
  dropdown: {
    admin: "🧙‍♂️ Bet Manager",
  },
};

export default AdminBets;
