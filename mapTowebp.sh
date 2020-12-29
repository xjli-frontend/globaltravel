

cwebp="/Volumes/works/lanwan_projects/game-globaltravel/packages/copyToNativeapp/libs/libwebp-0.4.1-mac-10.8/bin/cwebp"


for id in {1..10}
do
    map_path="/Volumes/works/lanwan_projects/game-globaltravel/assets/resources/scene/bg_texture/main_bg${id}.jpg"
    newfilepath="/Volumes/works/lanwan_projects/game-globaltravel/assets/resources/scene/bg_texture/main_bg${id}.webp"
    rm -rf newfilepath
    cwebp -q "75" -noalpha -jpeg_like "${map_path}" -o "${newfilepath}"
done