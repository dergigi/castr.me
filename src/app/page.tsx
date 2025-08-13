import Link from 'next/link'
import { ArrowRightIcon, RssIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25"></div>
                <div className="relative bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    castr.me
                  </h1>
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Transform Nostr feeds into beautiful podcast feeds. Listen to your favorite Nostr content on any podcast app with castr.me.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n"
                className="group rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-all duration-200 flex items-center gap-2"
              >
                Try Demo Feed
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="https://github.com/dergigi/pubcaster"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">How it works</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to listen to Nostr content
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              castr.me bridges the gap between Nostr and traditional podcast platforms, making decentralized content accessible everywhere.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <RssIcon className="h-5 w-5 flex-none text-indigo-600" />
                  RSS Feeds
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Generate RSS feeds from any Nostr npub. Perfect for podcast apps, news readers, and content aggregators.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <GlobeAltIcon className="h-5 w-5 flex-none text-indigo-600" />
                  Universal Access
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Access your Nostr content from any device or platform that supports RSS feeds.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <SparklesIcon className="h-5 w-5 flex-none text-indigo-600" />
                  Decentralized
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Built on Nostr's decentralized protocol. No central authority, no censorship, pure freedom.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Live Examples</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Many people use nostr to share media. RSS makes it easy to consume
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Here are some npubs that are regularly posting media content on nostr. Give them a try!
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 group-hover:bg-indigo-700 transition-colors">
                    <span className="text-sm font-semibold text-white">NS</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">No Solutions</h3>
                    <p className="text-xs text-gray-500">Demo Feed</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors">
                    <span className="text-sm font-semibold text-white">OD</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">ODELL</h3>
                    <p className="text-xs text-gray-500">Bitcoin Podcast</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 group-hover:bg-green-700 transition-colors">
                    <span className="text-sm font-semibold text-white">MB</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Marty Bent</h3>
                    <p className="text-xs text-gray-500">Bitcoin Content</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 group-hover:bg-purple-700 transition-colors">
                    <span className="text-sm font-semibold text-white">GG</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Gigi</h3>
                    <p className="text-xs text-gray-500">Bitcoin Educator</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1m64hnkh6rs47fd9x6wk2zdtmdj4qkazt734d22d94ery9zzhne5qw9uaks"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 group-hover:bg-orange-700 transition-colors">
                    <span className="text-sm font-semibold text-white">RY</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Ryan</h3>
                    <p className="text-xs text-gray-500">Bitcoin Content</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-600 group-hover:bg-yellow-700 transition-colors">
                    <span className="text-sm font-semibold text-white">HD</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">HODL</h3>
                    <p className="text-xs text-gray-500">Bitcoin Podcast</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-600 group-hover:bg-pink-700 transition-colors">
                    <span className="text-sm font-semibold text-white">YL</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">yellow</h3>
                    <p className="text-xs text-gray-500">Bitcoin Content</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/npub1sk7mtp67zy7uex2f3dr5vdjynzpwu9dpc7q4f2c8cpjmguee6eeq56jraw"
                className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
              >
                <div className="flex items-center gap-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 group-hover:bg-red-700 transition-colors">
                    <span className="text-sm font-semibold text-white">TF</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">TFTC</h3>
                    <p className="text-xs text-gray-500">Bitcoin Podcast</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to start listening?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Enter any Nostr npub to generate a podcast feed. Start with our demo or use your own.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n"
                className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-all duration-200"
              >
                Explore Demo Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 