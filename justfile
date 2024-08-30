set export

NOTION_TOKEN := ""
DATABASE_ID := "12476b6af58e41738258b896720a8f89"
API_HOST := "https://api.notion.com/v1"


default:
  just --list

dev:
   pnpm run dev

build:
  echo $NOTION_TOKEN
  pnpm run build