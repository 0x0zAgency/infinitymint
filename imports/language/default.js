/**
 * The strings! You can call these in the wild by
 *  import Resources from "./resources" //do not import Resources.$
 *
 *  console.log(Resources.$.UI.Action.CreateToken)
 *
 *  or if you are in JSX
 *
 *  <>
 *   {Resources.$.UI.Action.CreateToken}
 *  </>
 *
 * Uses some speical keys to do stuff
 *
 * %token% - the name of the token
 * %tokenCapitalized% - the name of the token Capitalized
 * %tokens% - the plural name for the tokens
 * %tokensCapitalized% - the Capitalized plural name for the tokens
 *
 * \\! - an s will be added to the plural variant of this key, but not if it is not plural
 *
 * Creating your own:-
 *
 *  The easiest way to do that is to copy and paste thiile, give it a neat name and then change resources key inside of Config.js to point to
 *  your new file.
 */

const Content = {
    UI: {
        Responses: {
            Success: '🎉 Success',
            Error: '🚨 Error',
            Warning: '⚠️ Warning',
            Info: 'ℹ️ Info',
        },
        Symbols: {
            Ready: '🟢',
            Loading: '🟠',
            Error: '🔴',
            Warning: '🟡',
            Info: '🔵',
            Success: '🟢',
            Unavailable: '⚪️',
            Available: '🟢',
            Delete: '❌',
            Edit: '✏️',
            Add: '➕',
            Back: '↩️',
            Cancel: '✖️',
            Accept: '✅',
            Change: '♻️',
            Close: '✖️',
            Connect: '🌎',
            Download: '💾',
            Apply: '👍',
            DeletePreview: '🗑️',
            DeleteSticker: '❌',
            DownloadSticker: '💾',
            AddSticker: '💸',
            AddToken: '➕',
            View: '👁️',
            Colours: '🎨',
        },
        Action: {
            Accept: '✅ Accept',
            AddSticker: '💸 Add Sponsor',
            AddToken: '➕ Add %tokenCapitalized%',
            Advertise: '🚀 Advertise or Sponsor',
            AllToken: '%tokenCapitalized%',
            Apply: '👍 Apply',
            Back: '↩️ Back',
            Back_Plural: '↩️ Back',
            BackToToken: '↩️ Back To %tokenCapitalized%',
            Cancel: '✖️ Cancel',
            Change: '♻️ Change',
            Close: '✖️ Close',
            ConnectWallet: '🌎 Connect',
            ConnectWallet_Plural: '🌎 Connect',
            CreateSticker: '🗂️ Create Sponsorship\\!',
            CreateToken: '🎉 Mint Pass',
            CustomToken: '✨ Custom %tokenCapitalized%',
            Delete: '💣 Delete',
            DeletePreview: '🗑️ Delete Preview',
            DeleteSticker: '❌ Delete Sticker',
            Download: '💾 Download\\!',
            DownloadSticker: '💾 Download Sticker',
            Edit: '✏️ Edit\\!',
            EditApperance: '🎨 Edit Apperance',
            EditColor: '🎨 Edit Color',
            EditColour: '🎨 Edit Colour',
            EditMetadata: '✏️ Edit Metadata',
            EditMetadata_Plural: '✏️ Edit Metadata',
            EditToken: '💎 Token & Gem Manager',
            FetchResult: '🔍 Fetch Result\\!',
            FinalizeSticker: '✅ Finalize Sponsorship',
            FindSticker: '🔍 Search Sponsorships',
            FindToken: '🔍 Select %tokenCapitalized%',
            Go: '↪️ Go',
            Goto: '↪️ Goto',
            GotoToken: '↪️ Goto %tokenCapitalized%',
            Inspect: '👀 Inspect',
            InspectSticker: '👀 Inspect Sponsorship',
            InspectToken: '👀 Inspect %tokenCapitalized%',
            InspectTokenURI: '👀 Inspect %tokenCapitalized% URI',
            Load: '💿 Load',
            LoadSticker: '💿 Load Sticker',
            LoadToken: '💿 Load %tokenCapitalized%',
            MintToken: '🎉 Mint Pass',
            MySticker: '🗒️ My Sticker\\!',
            MyToken: 'My %tokenCapitalized%',
            NavigateToToken: '🔼 Sail To %tokenCapitalized%',
            OpenSeaLink: '🌊 View on OpenSea',
            Overview: '🗺 Overview',
            PickSticker: '☝🏽 Pick Sponsor',
            PickToken: '☝🏽 Pick A %tokenCapitalized%',
            PlaceOffer: '💸 Place Offer\\!',
            PlaceSticker: '🤏 Place Sponsor',
            Preview: '🔮 Preview',
            PreviewMint: '☁️ Preview',
            PreviewSticker: '👁️ Preview Sponsor',
            PreviewToken: '☁️ Preview %tokenCapitalized%',
            Refresh: '🔃 Refresh',
            RefreshMini: '🔃',
            Reject: '❌ Reject',
            RedeemToken: '🎟 Redeem %tokenCapitalized%',
            RefreshToken: '🆕 Refresh Token',
            Reset: 'Reset Project',
            Revert: '⎌ Revert',
            RevertSticker: '⎌ Reset Sticker',
            Save: '💾 Save',
            Search: '🔍 Search\\?',
            Select: '👍 Select',
            SelectSticker: '✅ Select Sponsor',
            SelectToken: '☑️ Select %tokenCapitalized%',
            SelectiveMint: '☝🏽 Choose Your %tokenCapitalized%',
            SendOffer: '💸 Send Offer\\!',
            ShareLink: '🖇️ Copy URL',
            StickerControlCenter: '🗂️ Sponsorship Control Center',
            Submit: '✅ Submit',
            ToTop: '⏫ Top',
            TransferToken: '✈️ Transfer %tokenCapitalized%',
            TwitterLink: '🐦 View on X',
            TxLink: '🔗 View Transaction',
            UpdateTokenURI: '🆙 Token Display / URI Editor',
            Unselect: '✖️ De-select',
            View: '🧐 View',
            ViewSticker: '🔍 View Sponsor\\!',
            ViewToken: '♾️ Links and Content',
            Withdraw: '🏦 Withdraw Funds',
        },
        Misc: {
            Setting: '⚙️ Setting\\!',
            Statistic: '📈 Statistic\\!',
            Support: '❓ Support\\!',
            Transaction: '💱 Transaction\\!',
            YourToken: 'Your 🎉 Pass\\!',
        },
        Navbar: {
            Admin: '🛡️ Admin',
            AdminAuthentication: '📤 Authenticate',
            AdminENSRedirect: '🪞 ENS Reflect\\!',
            AdminGem: '💎 Gem\\!',
            AdminIPFS: '💾 IPFS',
            AdminMint: '🍃 Mint\\!',
            AdminModules: '💿 Modules',
            AdminRoyalty: '💰 Profits',
            AdminRoyalty_Plural: '🪙 Royalties',
            AdminUpdate: '🎫 Update Project',
            Code: '🎓 Documentation',
            DeveloperSetting: '🤖 Dev Settings\\!',
            Gallery: 'Party🥳People',
            Gallery_Plural: 'Party🥳People',
            Gem: '💎 Gem\\!',
            Home: '🏡 Home\\!',
            InfinityMint: '📈 InfinityMint',
            Mint: 'Mint 🎟️ Pass\\!',
            Options: '⚙️ Options\\!',
            Path_Editor: '✏️ Path Editor\\!',
            Preview: '📤 Preview\\!',
            ProjectEditor: '✨ Project Editor\\!',
            ProjectSetting: '⚙️ Project Setting\\!',
            Redeem: '🏷️ Redeem\\!',
            SelectiveMint: '⛏️ Selective Mint',
            Status: '🤖 Advanced\\!',
            Stickers: '🫥 EADS.eth',
            SVGToTinySVG: '🖋️ SVG ➡️ tinySVG',
            Team: '🎩 Authors',
            TinySVGToSVG: '🖋️ tinySVG ➡️ SVG',
            Tool: '🔧 Tool\\!',
            User: '🎁 Party Planner\\!',
            Users: '👥 %tokensCapitalized%',
            Utility: '🧰 Tools',
            Utility_Plural: '🧰 Tools',
        },
    },
    Pages: {
        Gallery: {
            Description: 'Party People have the best Party Time! See the latest parties, grab a ticket and get your party on!',
            PageTitle: 'Party🥳People',
            SubTitle:
                '',
            Title: 'Party🥳People',
        },
        Index: {
            Description: '',
            PageTitle: '🥳Time.eth',
            SubTitle: '',
            Title: '',
        },
        Mint: {
            Description: 'Mint your party party pass and get your party on! Party Pass holders can throw parties and mint tickets for any party they want to throw.',
            PageTitle: 'Mint🎉Pass',
            SubTitle:
                '',
            Title: 'Mint🎉Pass',
        },
        MyTokens: {
            Description: 'Manage your party passes, event ticketsm and other party time assets here.',
            PageTitle: 'My🎉Passes',
            SubTitle:
                '',
            Title: 'My🎉Passes',
        },
    },
};

export default Content;
