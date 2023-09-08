import React, { Component } from "react";
import {
  Col,
  Container,
  Row,
  Card,
  Button,
  Alert,
  Form,
} from "react-bootstrap";
import Loading from "../../../../Components/Loading";
import CreateURIModal from "../Modals/CreateURIModal";
import SetImageModal from "../Modals/SetImageModal";
import SaveTokenURIModal from "../Modals/SaveTokenURIModal";
import LoadTokenURIModal from "../Modals/LoadTokenURIModal";
import storageController from "infinitymint-client/dist/src/classic/storageController";
import controller from "infinitymint-client/dist/src/classic/controller";
import ipfsController from "infinitymint-client/dist/src/classic/ipfs/web3Storage";
import Mod_Bet from "../Resources/Mod_Bet.json";
import Mod_TokenBet from "../Resources/Mod_Bet.json";
import {
  send,
  waitSetState,
} from "infinitymint-client/dist/src/classic/helpers";
import NavigationLink from "../../../../Components/NavigationLink";

class AdminCreateBet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedBranch: null,
      betUri: {
        hasSetBranches: false,
        type: null,
        name: null,
        housePercentage: 20,
        startingPot: 0,
        price: 0,
        branches: {},
        hasDeployedContract: false,
        hasSetup: false,
        address: null,
        started: false,
        ready: false,
      },
      error: null,
      loading: true,
      hasChanges: false,
      showCreateURIModal: false,
      currentSavedValues: {},
    };
  }

  async componentDidMount() {
    let betUri = await storageController.getPagePreference("betUri");
    if (betUri) {
      this.setState({ betUri, loading: false });
    }
  }

  saveURI() {
    storageController.setPagePreference("betUri", {
      ...this.state.betUri,
    });
  }

  async publish() {
    ipfsController.createInstance(
      storageController.getGlobalPreference("web3StorageApiKey")
    );

    let uri = await ipfsController.uploadFile(
      "index.json",
      JSON.stringify(this.state.betUri)
    );

    let project = controller.getProjectSettings();

    console.log(project);
    let args = [
      project.contracts["Mod_HouseOracle"],
      project.contracts["InfinityMint"],
      uri,
      controller.web3.utils.toWei(this.state.betUri.price),
      this.state.betUri.housePercentage.toString(),
    ];

    let address;

    if (!this.state.betUri.hasDeployedContract) {
      let tx;
      if (this.state.betUri.type === "Mod_Bet") {
        tx = await controller.deployContract("Mod_Bet", args, {}, Mod_Bet);
      } else
        tx = await controller.deployContract(
          "Mod_TokenBet",
          args,
          {},
          Mod_TokenBet
        );

      address = tx._address;

      await waitSetState(this, {
        betUri: {
          ...this.state.betUri,
          address,
          hasDeployedContract: true,
        },
      });

      this.saveURI();
    } else address = this.state.betUri.address;

    //now initialize the contract
    controller.initializeContract(
      address,
      this.state.betUri.type,
      true,
      this.state.betUri.type === "Mod_Bet" ? Mod_Bet : Mod_TokenBet
    );

    if (!this.state.betUri.hasSetBranches) {
      //now add the branches
      await send(this.state.betUri.type, "setBranches", [
        Object.keys(this.state.betUri.branches).map((branch, index) => index),
        Object.keys(this.state.betUri.branches).map((branch, index) =>
          controller.web3.utils.utf8ToHex(index.toString())
        ),
      ]);

      await waitSetState(this, {
        betUri: {
          ...this.state.betUri,
          hasSetBranches: true,
        },
      });

      this.saveURI();
    }

    if (!this.state.betUri.hasSetup) {
      //now add the starting pot
      await send(this.state.betUri.type, "setInitialPot", {
        value: controller.web3.utils.toWei(
          this.state.betUri.startingPot.toString()
        ),
      });

      await waitSetState(this, {
        betUri: {
          ...this.state.betUri,
          hasSetup: true,
        },
      });

      this.saveURI();
    }

    await waitSetState(this, {
      betUri: {
        ...this.state.betUri,
        ready: true,
      },
    });

    this.saveURI();

    storageController.setGlobalPreference("temporaryBets", {
      ...(storageController.getGlobalPreference("temporaryBets") || {}),
      [address]: this.state.betUri,
    });
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
            <Container className="pt-4" hidden={!this.state.error}>
              <Row>
                <Col>
                  <Alert variant="danger">
                    {this.state.error?.message || this.state.error}
                  </Alert>
                </Col>
              </Row>
            </Container>
            <Container className="pt-4" hidden={this.state.betUri.ready}>
              <Row>
                <Col className="text-center">
                  <h1 className="text-black">
                    🛠️ {this.state.betUri?.name || "Unknown Bet"}{" "}
                    <span className="badge bg-info">
                      {this.state.betUri?.price
                        ? this.state.betUri?.price + " eth"
                        : "Free"}
                    </span>
                    {this.state.betUri?.startingPot ? (
                      <>
                        <br />
                        <span className="badge bg-info fs-5">
                          {this.state.betUri?.startingPot + " eth"} Pot
                        </span>
                      </>
                    ) : null}
                    {this.state.betUri?.housePercentage ? (
                      <>
                        <br />
                        <span className="badge bg-info fs-5">
                          {this.state.betUri?.housePercentage + "%"} Cut (
                          {this.state.betUri?.price
                            ? (
                                parseFloat(this.state.betUri?.price) *
                                (parseFloat(
                                  this.state.betUri?.housePercentage
                                ) /
                                  100)
                              ).toFixed(4) + " eth"
                            : "Unknown"}{" "}
                          )
                        </span>
                      </>
                    ) : null}
                  </h1>
                  <p className="fs-6 text-black">
                    {this.state.betUri?.description ||
                      "No Description Available..."}
                  </p>
                </Col>
              </Row>
              {!this.state.betUri?.type ? (
                <>
                  <Row>
                    <Col>
                      <Card body>
                        <div className="d-grid gap-2">
                          <Alert variant="info">
                            This type of bet will not require an ERC721 token to
                            be given and will instead by free for anybody to bet
                            upon. This is the simplest type of bet.
                          </Alert>
                          <Button
                            variant="success"
                            onClick={() => {
                              this.setState(
                                {
                                  betUri: {
                                    ...this.state.betUri,
                                    type: "Mod_Bet",
                                  },
                                },
                                () => {
                                  this.saveURI();
                                }
                              );
                            }}
                          >
                            Create Bet
                          </Button>
                        </div>
                      </Card>
                    </Col>
                    <Col>
                      <Card body>
                        <div className="d-grid gap-2">
                          <Alert variant="info">
                            This type of bet will require an ERC721 token and
                            will use the path id of the ERC721 token as the
                            branch. You must bet a branch for each path.
                          </Alert>
                          <Button
                            variant="success"
                            onClick={() => {
                              let branches =
                                Object.values(this.state.betUri.branches) || [];

                              if (branches.length === 0)
                                Object.keys(
                                  controller.getProjectSettings().paths
                                ).forEach((key) => {
                                  if (key === "default") return;
                                  let path =
                                    controller.getProjectSettings().paths[key];

                                  branches.push({
                                    name: path.name,
                                    data: {},
                                    image:
                                      path?.paths?.data ||
                                      "https://www.nicepng.com/png/detail/133-1334707_lost-icon-png-missing-icon-png.png",
                                  });
                                });

                              this.setState(
                                {
                                  betUri: {
                                    ...this.state.betUri,
                                    type: "Mod_TokenBet",
                                    branches: Object.values(branches),
                                  },
                                },
                                () => {
                                  this.saveURI();
                                }
                              );
                            }}
                          >
                            Create Token Bet
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              ) : (
                <>
                  <Row>
                    <Col>
                      <Alert variant="info">
                        You are creating a {this.state.betUri.type} bet.
                      </Alert>
                    </Col>
                  </Row>
                  <Row hidden={this.state.betUri.name}>
                    <Col>
                      <Alert variant="danger">
                        Your bet does not have a name. Please set a name before
                        publishing.
                      </Alert>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Card body>
                        <div className="d-grid gap-2">
                          <Button
                            variant="primary"
                            hidden={!this.state.hasChanges}
                            onClick={() => {
                              this.saveURI();
                              this.setState({
                                hasChanges: false,
                              });
                            }}
                          >
                            Save
                          </Button>
                          <Form.Group className="mb-1" controlId="name">
                            <Form.Label className="fs-5">Name</Form.Label>
                            <Form.Control
                              type="string"
                              size="sm"
                              onChange={(e) => {
                                this.setState({
                                  betUri: {
                                    ...this.state.betUri,
                                    name: e.target.value,
                                  },
                                  hasChanges: true,
                                });
                              }}
                              value={this.state.betUri.name}
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-1" controlId="name">
                            <Form.Label className="fs-5">
                              House Perecentage (Your Cut)
                            </Form.Label>
                            <Form.Control
                              type="number"
                              max={100}
                              min={0}
                              step={1}
                              maxLength={3}
                              size="sm"
                              onChange={(e) => {
                                if (e.target.value > 100) e.target.value = 100;

                                this.setState({
                                  betUri: {
                                    ...this.state.betUri,
                                    housePercentage: parseInt(e.target.value),
                                  },
                                  hasChanges: true,
                                });
                              }}
                              value={this.state.betUri.housePercentage}
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-1" controlId="name">
                            <Form.Label className="fs-5">
                              Price/Stake
                            </Form.Label>
                            <Form.Control
                              type="number"
                              step={0.1}
                              size="sm"
                              onChange={(e) => {
                                this.setState({
                                  betUri: {
                                    ...this.state.betUri,
                                    price: e.target.value,
                                  },
                                  hasChanges: true,
                                });
                              }}
                              value={this.state.betUri.price}
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-1" controlId="name">
                            <Form.Label className="fs-5">
                              Starting Pot
                            </Form.Label>
                            <Form.Control
                              type="number"
                              step={0.1}
                              size="sm"
                              onChange={(e) => {
                                this.setState({
                                  betUri: {
                                    ...this.state.betUri,
                                    startingPot: e.target.value,
                                  },
                                  hasChanges: true,
                                });
                              }}
                              value={this.state.betUri.startingPot}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-1" controlId="description">
                            <Form.Label className="fs-5">
                              Description
                            </Form.Label>
                            <Form.Control
                              type="string"
                              size="sm"
                              onChange={(e) => {
                                this.setState({
                                  betUri: {
                                    ...this.state.betUri,
                                    description: e.target.value,
                                  },
                                  hasChanges: true,
                                });
                              }}
                              value={this.state.betUri.description}
                              required
                            />
                          </Form.Group>
                        </div>
                        <Row hidden={this.state.betUri.branches.length !== 0}>
                          <Col>
                            <Alert variant="danger" className="mt-3">
                              You currently have not created any branches.
                              Please create a new branch to continue.
                            </Alert>
                          </Col>
                        </Row>
                        <Row xs={2} className="mt-3">
                          {this.state.betUri.branches.map((branch, index) => (
                            <Col>
                              <Card body>
                                <h5 className="text-black">
                                  {branch.name || "Unknown Branch"}{" "}
                                  <span className="text-muted">
                                    (branchId {index})
                                  </span>
                                </h5>
                                <p className="fs-6 text-black">
                                  {branch.description ||
                                    "No Description Available..."}
                                </p>
                                <Row
                                  className="justify-content-center items-center mb-4 bg-dark p-2"
                                  style={{
                                    height: "156px",
                                  }}
                                >
                                  <Col sm={3}>
                                    <img
                                      className="img-fluid img rounded"
                                      alt="branch"
                                      src={branch.image}
                                    />
                                  </Col>
                                </Row>

                                <div className="d-grid gap-2">
                                  <Button
                                    variant="info"
                                    onClick={() => {
                                      this.setState({
                                        selectedBranch: index,
                                        currentSavedValues:
                                          this.state.betUri.branches[index],
                                        showCreateURIModal: true,
                                      });
                                    }}
                                  >
                                    Edit Branch
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      this.setState({
                                        betUri: {
                                          ...this.state.betUri,
                                          branches:
                                            this.state.betUri.branches.filter(
                                              (branch, i) => i !== index
                                            ),
                                        },
                                        hasChanges: true,
                                      });
                                    }}
                                  >
                                    Delete Branch
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                        <div className="d-grid gap-2 mt-2">
                          <Button
                            variant="primary"
                            hidden={!this.state.hasChanges}
                            onClick={() => {
                              this.saveURI();
                              this.setState({
                                hasChanges: false,
                              });
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => {
                              this.setState({
                                selectedBranch: Object.values(
                                  this.state.betUri.branches
                                ).length,
                                showCreateURIModal: true,
                              });
                            }}
                          >
                            Create New Branch
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Card body>
                        <div className="d-grid gap-2">
                          <Button
                            variant="success"
                            disabled={
                              this.state.hasChanges || !this.state.betUri.name
                            }
                            hidden={
                              Object.values(this.state.betUri.branches)
                                .length === 0
                            }
                            onClick={() => {
                              this.setState({
                                loading: true,
                              });
                              this.publish()
                                .catch((e) => {
                                  console.error(e);
                                  this.setState({
                                    error: e.message,
                                  });
                                })
                                .finally(() => {
                                  this.setState({
                                    loading: false,
                                  });
                                });
                            }}
                          >
                            Publish
                          </Button>
                          <hr />
                          <Button
                            disabled={this.state.betUri.hasDeployedContract}
                            variant="primary"
                            onClick={() =>
                              this.setState(
                                {
                                  betUri: {
                                    ...this.state.betUri,
                                    type: null,
                                  },
                                },
                                () => {
                                  this.saveURI();
                                }
                              )
                            }
                          >
                            Change Bet Type
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() =>
                              this.setState(
                                {
                                  betUri: {
                                    branches: [],
                                  },
                                },
                                () => {
                                  this.saveURI();
                                }
                              )
                            }
                          >
                            Start Again
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </Container>
            <Container className="pt-4" hidden={!this.state.betUri.ready}>
              <Row>
                <Col>
                  <Alert variant="success">
                    Your bet is ready to begin! Please go to the
                    <u>admin bets page in order to start it!</u>
                  </Alert>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Card body>
                    <div className="d-grid gap-2">
                      <NavigationLink
                        to="/admin/bets"
                        variant="primary"
                        size="md"
                      >
                        Goto Admin Bets Page
                      </NavigationLink>
                      <Button
                        variant="primary"
                        onClick={() => {
                          this.setState({
                            betUri: {
                              branches: [],
                            },
                            selectedBranch: null,
                          });
                        }}
                      >
                        Create Another Bet
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Container>
            <SetImageModal
              fileName={this.state.currentImageKey}
              show={this.state.showSetImageModal}
              onSetImage={(fileName, imageLocation) => {
                let _sv = {
                  ...this.state.currentSavedValues,
                  [fileName]: imageLocation,
                };

                if (_sv?.data?.images) _sv?.data?.images.push(fileName);

                this.setState({
                  currentSavedValues: _sv,
                  showSetImageModal: false,
                  showCreateURIModal: true,
                });
              }}
              onHide={() => {
                this.setState({
                  showSetImageModal: false,
                  showCreateURIModal: true,
                });
              }}
            />
            <SaveTokenURIModal
              show={this.state.showSaveTokenURIModal}
              onHide={() => {
                this.setState({
                  showSaveTokenURIModal: false,
                });
              }}
              onShowCreateURIModal={() => {
                this.setState({
                  showSaveTokenURIModal: false,
                  showCreateURIModal: true,
                });
              }}
              savedValues={this.state.currentSavedValues}
            />
            <LoadTokenURIModal
              show={this.state.showLoadURIModal}
              onHide={(returnToCreateURIModal) => {
                this.setState({
                  showLoadURIModal: false,
                  showCreateURIModal: returnToCreateURIModal,
                });
              }}
              onLoad={(values) => {
                this.setState({
                  currentSavedValues: values,
                  showLoadURIModal: false,
                  showCreateURIModal: true,
                });
              }}
            />
            <CreateURIModal
              onSetTokenURI={async (values) => {
                let branches = this.state.betUri.branches;
                branches[this.state.selectedBranch] = values;
                this.setState(
                  {
                    betUri: {
                      ...this.state.betUri,
                      branches: branches,
                    },
                    showCreateURIModal: false,
                  },
                  () => {
                    this.saveURI();
                  }
                );
              }}
              show={this.state.showCreateURIModal}
              savedValues={this.state.currentSavedValues}
              onHide={() => {
                this.setState({
                  showCreateURIModal: false,
                });
              }}
              onLoad={() => {
                this.setState({
                  showCreateURIModal: false,
                  showLoadURIModal: true,
                });
              }}
              onSave={(values) => {
                this.setState({
                  currentSavedValues: values,
                  showCreateURIModal: false,
                  showSaveTokenURIModal: true,
                });
              }}
              onSetImage={(key, values) => {
                this.setState({
                  currentSavedValues: values,
                  currentImageKey: key,
                  showCreateURIModal: false,
                  showSetImageModal: true,
                });
              }}
            />
          </>
        )}
        <br />
        <br />
        <br />
      </>
    );
  }
}

AdminCreateBet.url = "/admin/bets/create";
AdminCreateBet.id = "AdminCreateBet";
AdminCreateBet.settings = {
  requireWallet: true,
  requireWeb3: true,
  requireAdmin: true,
  dropdown: {
    admin: "💵 Create Bet",
  },
};

export default AdminCreateBet;
