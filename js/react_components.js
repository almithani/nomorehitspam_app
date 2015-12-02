window.UrlItem = React.createClass({

	render: function() {
		var liClass = "unsaved";
		if( this.props.curState==2 ) {	liClass="saving"; }
		else if( this.props.curState==3 ) {	liClass="saved"; }
		else if( this.props.curState==4 ) {	liClass="error"; }

		return (
			<li className={liClass}>{this.props.url} ({liClass})</li>
		);
	}
});

window.CollectUrls = React.createClass({
	UNSAVED: 1,
	SAVING: 2,
	SAVED: 3,
	ERROR: -1,

	getInitialState: function() {
		return {
			urls: []
		}
	},

	addItem: function() {
		var inputVal = this.refs.inputUrl.value;
		var urlItem = {
			url: inputVal,
			curState: this.UNSAVED
		}
		var newUrls = _.union( this.state.urls, [urlItem] );

		this.setState({
			urls: newUrls
		})
	},

	updateItem: function(key, state) {
		this.state.urls[key].curState = state;
		this.setState({
			urls: this.state.urls
		})
	},

	save: function() {
		var accountId = this.props.profile.accountId;
		var profileId = this.props.profile.id;
		var propertyId = this.props.profile.webPropertyId;

		var updateItem = this.updateItem;
		var savingState = this.SAVING;
		var savedState = this.SAVED;
		var errorState = this.ERROR;

		_.each(this.state.urls, function(url, key) {

			updateItem( key, savingState);

			var params = {
				accountId: accountId,
				name: "nomorehitspam - "+url.url,
				type: "EXCLUDE",
				excludeDetails: {
					field: "REFERRAL",
					expressionValue: ".*"+url.url+".*"					
				}
			}
			gapi.client.analytics.management.filters.insert(params).then(function(response){
				
				var linkParams = {
					accountId: accountId,
					profileId: profileId,
					webPropertyId: propertyId,
					filterRef: {
						id: response.result.id
					}
				}
				gapi.client.analytics.management.profileFilterLinks.insert(linkParams).then(function(response){
					console.log(response);

					if( response.error ) {
						updateItem( key, errorState);
					} else {
						updateItem( key, savedState);
					}	
				});
			});
		});

	},

render: function() {

		var profileName = this.props.profile.websiteUrl+' - '+this.props.profile.name;

		var urlItems = [];
		_.each(this.state.urls, function(url){
			urlItems.push(<UrlItem 
								url={url.url} 
								curState={url.curState}
								key={url.url} />);
		});

		var saveButton = '';
		if(this.state.urls.length > 0) {
			saveButton = <a onClick={this.save} className="btn">save filters</a>;
		}

		return (
			<div className="collect-urls">
				<h2>Add filters for {profileName}:</h2>
				<input 
					type="text" 
					placeholder="enter the url of the hit spam..."
					ref="inputUrl" /> 
				<a onClick={this.addItem} className="btn">add</a>

				<ul className="url-list">
				{urlItems}
				</ul>

				{saveButton}
			</div>
		);
	}
});

window.Profile = React.createClass({

	nextStep: function() {
		this.props.gotoNextStep(this.props.profile);
	},

	render: function() {
		return (
			<li>
				<a onClick={this.nextStep} className="btn profile-name">{this.props.profile.name}</a>
			</li>
		);
	}
});

window.ProfileList = React.createClass({

	render: function() {

		var profiles = [];
		var gotoNextStep = this.props.gotoNextStep;
		_.each(this.props.profiles, function(profile) {
			profiles.push(<Profile 
								gotoNextStep={gotoNextStep} 
								profile={profile} 
								key={profile.id} />);
		});

		return (
			<div>
				<h2>Select a view to filter spam from:</h2>
				<ul className="profile-list">
					{profiles}
				</ul>
			</div>
		);
	}
});

window.Account = React.createClass({

	getInitialState: function() {
		return { 
			profiles: false,
		};
	},

	setProfiles: function(profiles) {
		this.setState({
			profiles: profiles
		});
	},

	getProfiles: function() {
		var params = {
			accountId: this.props.account.id,
			webPropertyId: '~all'
		}

		var setProfiles = this.props.gotoNextStep;
		gapi.client.analytics.management.profiles.list(params).then(function(response) {
			setProfiles(response.result.items);
		});
	},

	render: function() {
		return (
			<li className="account">
				<a onClick={this.getProfiles} className="btn account-name">{this.props.account.name}</a>
			</li>
		);
	}
});

window.AccountList = React.createClass({
	render: function() {
		var accounts = [];
		var gotoNextStep = this.props.gotoNextStep;
		_.each(this.props.accounts, function(account){
			accounts.push(<Account 
								gotoNextStep={gotoNextStep} 
								account={account} 
								key={account.id} />);
		});

		return(
			<div>
				<h2>Select a website to filter spam from:</h2>
				<ul className="account-list">
					{accounts}
				</ul>
			</div>
		);
	}
});

window.StartPrompt = React.createClass({

	authorize: function() {
	    var authData = {
	        client_id: this.props.gaClientID,
	        scope: this.props.gaScopes,
	        immediate: false
	    };	

	    var getAccounts = this.getAccounts;
	    gapi.auth.authorize(authData, function(response) {
	        if (response.error) {
	            console.log("authorize error: "+response.error);
	        } else {
	            getAccounts();
	        }
	    });	    	
	},

	getAccounts: function() {
		var handleAccounts = this.handleAccounts;
	    // Load the Google Analytics client library.
	    gapi.client.load('analytics', 'v3').then(function() {
	        // Get a list of all Google Analytics accounts for this user
	        gapi.client.analytics.management.accounts.list().then(handleAccounts);
	    });
	},

	handleAccounts: function(response) {
	    // Handles the response from the accounts list method.
	    if (response.result.items && response.result.items.length) {
	    	this.props.gotoNextStep(response.result.items);
	    } else {
	        this.props.gotoNextStep([]);
	    }
	},

	render: function() {
		return (
			<div>
				<a className="btn" onClick={this.authorize}>Get Rid of Spam Now</a>
			</div>
		);
	}
});

window.AppFlow = React.createClass({

	getInitialState: function() {
		return {
			currentStep: 1,
			gaAccounts: [],
			gaProfiles: [],
			selectedProfile: null,
		}
	},

	gotoStep2: function(accounts) {
		this.setState({
			currentStep: 2,
			gaAccounts: accounts			
		})
	},

	gotoStep3: function(profiles) {
		this.setState({
			currentStep: 3,
			gaProfiles: profiles
		});
	},

	gotoStep4: function(profile) {
		this.setState({
			currentStep: 4,
			selectedProfile: profile
		});
	},

	render: function() {
		switch( this.state.currentStep ) {
			case 4:
				return (
					<CollectUrls
						profile={this.state.selectedProfile} />
				);
				break;

			case 3:
				return (
					<ProfileList 
						gotoNextStep={this.gotoStep4}
						profiles={this.state.gaProfiles} />
				);
				break;

			case 2: 
				return (
					<AccountList 
						gotoNextStep={this.gotoStep3}
						accounts={this.state.gaAccounts} />
				);
				break;

			case 1: 
			default: 
				return (
					<StartPrompt 
						gotoNextStep={this.gotoStep2} 
						gaClientID={this.props.gaClientID} 
						gaScopes={this.props.gaScopes} />
				);
		}
	}
});