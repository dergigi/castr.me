#!/bin/bash

# Simple script to download profile images for examples
set -e

# Create profiles directory
mkdir -p public/profiles

# Function to download and resize image
download_and_resize() {
    local npub=$1
    local url=$2
    
    echo "Processing $npub..."
    
    # Create safe filename
    local filename=$(echo "$npub" | sed 's/[^a-zA-Z0-9]/_/g')
    local output_path="public/profiles/${filename}.jpg"
    
    # Download and resize
    curl -s -L -o "$output_path" "$url" && \
    convert "$output_path" -resize 80x80^ -gravity center -extent 80x80 "$output_path" && \
    echo "✓ $npub" || echo "✗ $npub (failed)"
}

# Download known profile images
echo "Downloading profile images..."

# Download all profile images with correct URLs
download_and_resize "npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n" "https://haven.sovereignengineering.io/29995d6f3c18f5cd881519e08a34292ccbd2f0996df288e9b125dea69d259eee.jpg"
download_and_resize "npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx" "https://m.primal.net/NcKe.jpg"
download_and_resize "npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy" "https://miro.medium.com/max/400/1*dhfvb6QtrA-XDoT2EE4rmA.jpeg"
download_and_resize "npub1f4uyypghstsd8l4sxng4ptwzk6awfm3mf9ux0yallfrgkm6mj6es50r407" "https://blossom.primal.net/3feb02dec97701ff9a890599ed0f095ae143b6c3641f0da97be8132ce220a820.png"
download_and_resize "npub1m64hnkh6rs47fd9x6wk2zdtmdj4qkazt734d22d94ery9zzhne5qw9uaks" "https://i.nostr.build/eJ34.jpg"
download_and_resize "npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs" "https://i.postimg.cc/yd4j6Znb/0-AE2325-A-C9-A0-475-C-8-ED3-F012-E5-E3-C426.gif"
download_and_resize "npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn" "https://pfp.nostr.build/da0cd6f4986addd5472120a38b9a3b83f240cdd5fe92c53ddc1cc9694fd13a81.jpg"
download_and_resize "npub1sk7mtp67zy7uex2f3dr5vdjynzpwu9dpc7q4f2c8cpjmguee6eeq56jraw" "https://m.primal.net/JzaW.jpg"
download_and_resize "npub1tn2lspfvv7g7fpulpexmjy6xt4c36h6lurq2hxgyn3sxf3drjk3qrchmc3" "https://pfp.nostr.build/3673a0f8dd86f01ebeb8e99e2b45f0cf3ae225aa673d325d2d5ce08ef112cc2c.webp"
download_and_resize "npub1spdnfacgsd7lk0nlqkq443tkq4jx9z6c6ksvaquuewmw7d3qltpslcq6j7" "https://nostr.build/i/nostr.build_022e43d7dec5b66d6bc8be6aa47117b5b8850ce0767e76df6ded4143fa5bbd14.jpeg"
download_and_resize "npub1ztzpz9xepmxsry7jqdhjc32dh5wtktpnn9kjq5eupdwdq06gdn6s0d7zxv" "https://image.nostr.build/8b5334beac3710b9433371ffd95cc4a7b6829868b218861c8ec48631cb9bece6.jpg"
download_and_resize "npub1h8nk2346qezka5cpm8jjh3yl5j88pf4ly2ptu7s6uu55wcfqy0wq36rpev" "https://i.nostr.build/GZd3CdZZ7kR1SNS1.png"
download_and_resize "npub1cn4t4cd78nm900qc2hhqte5aa8c9njm6qkfzw95tszufwcwtcnsq7g3vle" "https://nostr.build/i/f39c206af543e32d45de9b23395c96aad2ec0821653a53f3c5e186083318e315.jpg"

# TODO: Add URLs for these profiles when available
# download_and_resize "npub1wtx46rfjvevydmp8espegmw2tz93ujyg4es3eqwzle2jjft0p23qdu0rjx" "URL_FOR_THE_GOOD_STUFF"
# download_and_resize "npub1z204rz2az24ne8xuym9j90dmnh533e03elucjslnsc802wjyrqps6vmxwn" "URL_FOR_BITMAN"
# download_and_resize "npub10atn74wcwh8gahzj3m0cy22fl54tn7wxtkg55spz2e3mpf5hhcrs4602w3" "URL_FOR_CITADEL_DISPATCH"

echo "Done!"
