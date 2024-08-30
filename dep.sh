#!/bin/bash

export NOTION_TOKEN=""
export DATABASE_ID="12476b6af58e41738258b896720a8f89"
export API_HOST="https://api.notion.com/v1"


echo "start installing dependencies" 
pnpm install 

echo $NOTION_TOKEN 

echo "start building" 
pnpm run build 

echo "finished deploying" 


