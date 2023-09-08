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
            Success: '🤠 Success\\g',
            Failure: '😭 Failure\\!',
            Error: '😢 Error\\!',
        },
        Action: {
            CreateToken: '✨ Create a %tokenCapitalized%',
            RedeemToken: '🎟 Redeem a %tokenCapitalized%',
            CreateSticker: '🗂️ Create Sticker\\!',
            PlaceSticker: '🤏 Place Sticker',
            SelectSticker: '✅ Select Sticker',
            FindSticker: '🔍 Search Sticker',
            PickSticker: '☝🏽 Pick Sticker',
            PreviewSticker: '👁️ Preview Sticker',
            Overview: '🗺 Overview',
            InspectSticker: '👀 Inspect Sticker',
            AddSticker: '💸 Add Sticker',
            AllToken: '🌠 All %tokenCapitalized%',
            TopToken: '🌠 Top %tokenCapitalized%',
            StickerControlCenter: '🌎 Sticker Control Center\\!',
            MyToken: '🔍 My %tokenCapitalized%',
            EditToken: '✏️ Edit %tokenCapitalized%',
            CustomToken: '✨ Custom %tokenCapitalized%',
            MySticker: '🗒️ My Sticker\\!', //because of \\! will produce the result of My Stickers at Resources.$.Action.MySticker_Plural
            InspectToken: '👀 Inspect %tokenCapitalized%',
            Inspect: '👀 Inspect',
            Preview: '🔮 Preview',
            SelectToken: '☑️ Select %tokenCapitalized%',
            FindToken: '🔍 Select %tokenCapitalized%',
            FetchResult: '🔍 Fetch Result\\!',
            PickToken: '☝🏽 Pick %tokenCapitalized%',
            MintToken: '✨ Create a %tokenCapitalized%',
            BackToToken: '↩️ Back To %tokenCapitalized%',
            GotoToken: '↪️ Goto %tokenCapitalized%',
            Goto: '↪️ Goto',
            Go: '↪️ Go',
            Refresh: '🔃 Refresh',
            NavigateToToken: '🔼 Sail To %tokenCapitalized%',
            ToTop: '⏫ Top',
            PreviewMint: '☁️ Preview Pass Covers',
            PreviewToken: '☁️ Preview %tokenCapitalized%',
            Generic: '✅ Go',
            Submit: '✅ Submit',
            Accept: '✅ Accept',
            Save: '💾 Save',
            FinalizeSticker: '✅ Finalize Sticker',
            Select: '👍 Select',
            Unselect: '✖️ Unselect',
            Cancel: '✖️ Cancel',
            Search: '🔍 Search\\?',
            Apply: '👍 Apply',
            Close: '✖️ Close',
            Delete: '💣 Delete',
            DeletePreview: '🗑️ Delete Preview',
            Change: '♻️ Change',
            Reset: '⎌ Reset',
            Back: '↩️ Back',
            Back_Plural: '↩️ Back',
            Revert: '⎌ Revert',
            Reject: '❌ Reject',
            DeleteSticker: '❌ Delete Sticker',
            Withdraw: '🏦 Withdraw Funds',
            Edit: '✏️ Edit\\!',
            EditMetadata: '✏️ Edit Metadata',
            EditMetadata_Plural: '✏️ Edit Metadata',
            EditColour: '🎨 Edit Colour',
            EditColor: '🎨 Edit Color',
            EditApperance: '🎨 Edit Apperance',
            Download: '💾 Download\\!',
            Load: '💿 Load',
            Advertise: '🚀 Advertise or Sponsor',
            ViewToken: '🔍 View %tokenCapitalized%',
            TransferToken: '✈️ Transfer %tokenCapitalized%',
            AddToken: '➕ Add %tokenCapitalized%',
            ViewSticker: '🔍 View Sticker\\!',
            View: '🧐 View',
            PlaceOffer: '💸 Place Offer\\!',
            SendOffer: '💸 Send Offer\\!',
            DownloadSticker: '💾 Download Sticker',
            LoadSticker: '💿 Load Sticker',
            LoadToken: '💿 Load %tokenCapitalized%',
            RevertSticker: '⎌ Reset Sticker',
            ConnectWallet: '🌎 Connect',
            ConnectWallet_Plural: '🌎 Connect',
        },
        Symbols: {
            Delete: '💣',
            View: '🔍',
            Colours: '🎨',
            Ready: '👍',
        },
        Misc: {
            Statistic: '📈 Statistic\\!',
            Support: '❓ Support\\!',
            Transaction: '💱 Transaction\\!',
            Setting: '⚙️ Setting\\!',
        },
        Navbar: {
            Fact: '🤓 Fact\\!',
            Code: '💾 Code\\!',
            Team: '🌎 Team\\!',
            Mint: '✨ Mint\\!',
            Home: '🏛️ Home\\!',
            Gallery: '🧐 Gallery',
            Gallery_Plural: '🧐 Galleries',
            Preview: '📤 Preview\\!',
            Utility: '✏️ Utility',
            Utility_Plural: '✏️ Utilities',
            User: '%tokenCapitalized%',
            Users: '%tokensCapitalized%',
            Tool: '🔧 Tool\\!',
            Stickers: '✨ EADS',
            Admin: '🧙‍♂️ Admin\\!',
            Gem: '💎 Gem\\!',
            AdminMint: '💎 Mint\\!',
            AdminENSRedirect: '🧶 ENS Redirect\\!',
            AdminRoyalty: '💵 Profits',
            AdminIPFS: '📜 IPFS',
            AdminUpdate: '📝 Update',
            AdminRoyalty_Plural: '💵 Royalties',
            ProjectSetting: '⚙️ Project Setting\\!',
            ProjectEditor: '✨ Project Editor\\!',
            DeveloperSetting: '🤖 Developer Setting\\!',
            Status: '🤖 Status\\!',
            Path_Editor: '✏️ Path Editor\\!',
            TinySVGToSVG: 'tinySVG ➡️ SVG',
            SVGToTinySVG: 'SVG ➡️ tinySVG',
        },
    },
    //TODO: All pages need to be added
    //NOTE: Further detail might be inside of the pages them selves such as paragraphs and the such
    Pages: {
        Gallery: {
            PageTitle: 'Gallery',
            Title: 'Gallery',
            SubTitle: 'All of the %tokens%!',
            Description: '',
        },
        Index: {
            PageTitle: '%tokenCapitalized% Minter',
            Title: '%tokenCapitalized% Minter',
            SubTitle: '',
            Description: '',
        },
        MyTokens: {
            PageTitle: '',
            Title: 'My %tokensCapitalized%',
            SubTitle: 'Your collection is ever growing!',
            Description: '',
        },
        Mint: {
            PageTitle: 'Mint',
            Title: 'Mint',
            SubTitle: 'Here you can mint a %tokenCapitalized%.',
            Description: '',
        },
    },
};

export default Content;
