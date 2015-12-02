window.Lightbox = React.createClass({
	/*
		This is a barebones lightbox.  Uses props.children (aka DOM children) as content.
		Use property closeLightbox to bind to the close event.
	*/
	scrollHandler: function(event) {
		event.preventDefault();
	},

	contentClick: function(event) {
		//this is to prevent lightbox closing on click
		event.stopPropagation();
	},

	render: function(){
		return (
			<div>
				<div className='lightbox-overlay' onClick={this.props.closeLightbox} />
				<div className='lightbox-container' onClick={this.props.closeLightbox} onScroll={this.scrollHandler} onWheel={this.scrollHandler}>
					<div className='lightbox-content' onClick={this.contentClick}>
						<a className='lightbox-btn-close' onClick={this.props.closeLightbox}>x</a>
						{this.props.children}
					</div>
				</div>
			</div>
		);
	}  
});

window.CollectUrlsLightbox = React.createClass({

	getInitialState: function() {
		return {
			urls: []
		}
	},

	addItem: function() {
		var inputVal = this.refs.inputUrl.value;
		var newUrls = _.union( this.state.urls, [inputVal] );

		this.setState({
			urls: newUrls
		})
	},

	save: function() {
		var accountId = this.props.profile.accountId;
		var profileId = this.props.profile.id;
		var propertyId = this.props.profile.webPropertyId;

		_.each(this.state.urls, function(url) {
			var params = {
				accountId: accountId,
				name: "nomorehitspam - "+url,
				type: "EXCLUDE",
				excludeDetails: {
					field: "REFERRAL",
					expressionValue: ".*"+url+".*"					
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
				});
			});
		});

	},

	render: function() {

		var profileName = this.props.profile.websiteUrl+' - '+this.props.profile.name;

		var urlItems = [];
		_.each(this.state.urls, function(url){
			urlItems.push(<li>{url}</li>);
		});

		var saveButton = '';
		if(this.state.urls.length > 0) {
			saveButton = <a onClick={this.save}>save</a>;
		}

		return (
			<Lightbox closeLightbox={this.props.closeLightbox}>
				<h3>Add filters for {profileName}:</h3>
				<input 
					type="text" 
					placeholder="enter the url of the hit spam..."
					ref="inputUrl" /> 
				<a onClick={this.addItem}>add</a>

				<ul>
				{urlItems}
				</ul>

				{saveButton}
			</Lightbox>
		);
	}
});