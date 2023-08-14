# Test cases migration tool from TestLink to Test IT

## Installation

npm install

## Get projects IDs from Test IT and TestLink

npm run getProjects -- --testlinkhost="SET_IP_TESTLINK" --testlinkport="80" --testlinksecure=0
    --testlinkapiKey="SET_APIKEY_TESTLINK" --testithost="SET_HOST_TESTIT" --testitapiKey="SET_APIKEY_TESTIT"

## Import Test cases
npm run import -- --testlinkhost="SET_IP_TESTLINK" --testlinkport="80" --testlinksecure=0
    --testlinkapiKey="SET_APIKEY_TESTLINK" --testithost="SET_HOST_TESTIT" --testitapiKey="SET_APIKEY_TESTIT"
    --testlinkprojectId="SET_ID_PROJECT_TESTLINK" --testitprojectId="SET_ID_PROJECT_TESTIT"