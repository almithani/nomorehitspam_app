window.Profile = React.createClass({

	getInitialState: function() {
		return {
			selected: false
		}
	},

	showLightbox: function() {
		this.setState({
			selected: true
		});
	},

	hideLightbox: function() {
		this.setState({
			selected: false
		});
	},

	render: function() {

		var profileName = this.props.profile.websiteUrl+' - '+this.props.profile.name;

		var lightbox = '';
		if( this.state.selected ) {
			lightbox = <CollectUrlsLightbox 
							profile={this.props.profile}
							closeLightbox={this.hideLightbox} />
		}

		return (
			<li>
				<a onClick={this.showLightbox}>{profileName}</a>
				{lightbox}
			</li>
		);
	}
});

window.ProfileList = React.createClass({

	render: function() {

		var profiles = [];
		_.each(this.props.profiles, function(profile) {
			profiles.push(<Profile profile={profile} />);
		});

		return (
			<ul>
				{profiles}
			</ul>
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

		var setProfiles = this.setProfiles;
		gapi.client.analytics.management.profiles.list(params).then(function(response) {
			setProfiles(response.result.items);
		});
	},

	render: function() {
		return (
			<li className="account">
				<a onClick={this.getProfiles} className="account-name">{this.props.account.name}</a>
				<ProfileList profiles={this.state.profiles} />
			</li>
		);
	}
});

window.AccountList = React.createClass({
	render: function() {
		var accounts = [];
		_.each(this.props.accounts, function(account){
			accounts.push(<Account account={account} />);
		});

		return(
			<ul>
				{accounts}
			</ul>
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
			gaAccounts: []
		}
	},

	gotoStep2: function(accounts) {
		this.setState({
			currentStep: 2,
			gaAccounts: accounts			
		})
	},

	render: function() {
		switch( this.state.currentStep ) {
			case 2: 
				return (
					<AccountList accounts={this.state.gaAccounts} />
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