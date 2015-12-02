// ga auth params
var CLIENT_ID = '859694577985-tuhm68ncftqj9hl0kuhv6b4ms0j9f3uf.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/analytics.edit'];


function init() {
    gapi.auth.init();
}

ReactDOM.render(
    <AppFlow gaClientID={CLIENT_ID} gaScopes={SCOPES} />,
    document.getElementById('content')
);