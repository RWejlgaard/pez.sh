deploy-firebase:
	firebase deploy

deploy-ipfs:
	bash deploy-ipfs.sh

publish: deploy-firebase deploy-ipfs