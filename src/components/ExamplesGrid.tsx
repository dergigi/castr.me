import Link from 'next/link'
import Image from 'next/image'
import { NostrService } from '@/services/nostr/NostrService'

// Define the profile interface
interface NostrProfile {
  name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  lud06?: string;
  nodeid?: string;
}

// Define the example interface
interface Example {
  npub: string;
  name: string;
  fallbackDescription: string;
  fallbackInitials: string;
  fallbackColor: string;
  localImage: string;
}

// Define the example data
const examples: Example[] = [
  {
    npub: 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n',
    name: 'No Solutions',
    fallbackDescription: 'Demo Feed',
    fallbackInitials: 'NS',
    fallbackColor: 'bg-indigo-600',
    localImage: '/profiles/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n.jpg'
  },
  {
    npub: 'npub10atn74wcwh8gahzj3m0cy22fl54tn7wxtkg55spz2e3mpf5hhcrs4602w3',
    name: 'Citadel Dispatch',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'CD',
    fallbackColor: 'bg-amber-600',
    localImage: '/profiles/npub10atn74wcwh8gahzj3m0cy22fl54tn7wxtkg55spz2e3mpf5hhcrs4602w3.jpg'
  },
  {
    npub: 'npub1sk7mtp67zy7uex2f3dr5vdjynzpwu9dpc7q4f2c8cpjmguee6eeq56jraw',
    name: 'TFTC',
    fallbackDescription: 'Bitcoin Podcast',
    fallbackInitials: 'TF',
    fallbackColor: 'bg-red-600',
    localImage: '/profiles/npub1sk7mtp67zy7uex2f3dr5vdjynzpwu9dpc7q4f2c8cpjmguee6eeq56jraw.jpg'
  },
  {
    npub: 'npub1wtx46rfjvevydmp8espegmw2tz93ujyg4es3eqwzle2jjft0p23qdu0rjx',
    name: 'The Good Stuff',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'GS',
    fallbackColor: 'bg-slate-600',
    localImage: '/profiles/npub1wtx46rfjvevydmp8espegmw2tz93ujyg4es3eqwzle2jjft0p23qdu0rjx.jpg'
  },
  {
    npub: 'npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx',
    name: 'ODELL',
    fallbackDescription: 'Bitcoin Podcast',
    fallbackInitials: 'OD',
    fallbackColor: 'bg-blue-600',
    localImage: '/profiles/npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx.jpg'
  },
  {
    npub: 'npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy',
    name: 'Marty Bent',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'MB',
    fallbackColor: 'bg-green-600',
    localImage: '/profiles/npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy.jpg'
  },
  {
    npub: 'npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs',
    name: 'HODL',
    fallbackDescription: 'Bitcoin Podcast',
    fallbackInitials: 'HD',
    fallbackColor: 'bg-yellow-600',
    localImage: '/profiles/npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs.jpg'
  },
  {
    npub: 'npub1h8nk2346qezka5cpm8jjh3yl5j88pf4ly2ptu7s6uu55wcfqy0wq36rpev',
    name: 'Guy Swann',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'GS',
    fallbackColor: 'bg-violet-600',
    localImage: '/profiles/npub1h8nk2346qezka5cpm8jjh3yl5j88pf4ly2ptu7s6uu55wcfqy0wq36rpev.jpg'
  },
  {
    npub: 'npub1cn4t4cd78nm900qc2hhqte5aa8c9njm6qkfzw95tszufwcwtcnsq7g3vle',
    name: 'Jack Mallers',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'JM',
    fallbackColor: 'bg-rose-600',
    localImage: '/profiles/npub1cn4t4cd78nm900qc2hhqte5aa8c9njm6qkfzw95tszufwcwtcnsq7g3vle.jpg'
  },
  {
    npub: 'npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn',
    name: 'yellow',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'YL',
    fallbackColor: 'bg-pink-600',
    localImage: '/profiles/npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn.jpg'
  },
  {
    npub: 'npub1f4uyypghstsd8l4sxng4ptwzk6awfm3mf9ux0yallfrgkm6mj6es50r407',
    name: 'FLASH',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'FL',
    fallbackColor: 'bg-purple-600',
    localImage: '/profiles/npub1f4uyypghstsd8l4sxng4ptwzk6awfm3mf9ux0yallfrgkm6mj6es50r407.jpg'
  },
  {
    npub: 'npub1tn2lspfvv7g7fpulpexmjy6xt4c36h6lurq2hxgyn3sxf3drjk3qrchmc3',
    name: 'Movie Archive',
    fallbackDescription: 'Movie Content',
    fallbackInitials: 'MA',
    fallbackColor: 'bg-teal-600',
    localImage: '/profiles/npub1tn2lspfvv7g7fpulpexmjy6xt4c36h6lurq2hxgyn3sxf3drjk3qrchmc3.jpg'
  }
]

// Create service instance
const nostrService = new NostrService()

// Initialize NDK connection
let initialized = false

const PROFILE_TIMEOUT_MS = 800

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise<T>(resolve => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve(onTimeout())
      }
    }, ms)

    promise
      .then(result => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(result)
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(onTimeout())
        }
      })
  })
}

// Function to truncate description to keep it very short
function truncateDescription(description: string): string {
  if (!description) return ''
  
  // Remove extra whitespace and newlines
  const cleanDescription = description.trim().replace(/\s+/g, ' ')
  
  // If it's already short (4 words or less), return as is
  const words = cleanDescription.split(' ')
  if (words.length <= 4) return cleanDescription
  
  // Find the first sentence (ending with . ! ?)
  const sentenceMatch = cleanDescription.match(/^[^.!?]+[.!?]/)
  if (sentenceMatch) {
    const sentence = sentenceMatch[0].trim()
    // If the sentence is very short, use it
    if (sentence.length <= 50) return sentence
  }
  
  // Otherwise, take first 4 words and add ellipsis
  return words.slice(0, 4).join(' ') + '...'
}

async function getProfileData(npub: string): Promise<NostrProfile | null> {
  try {
    // Initialize NDK if not already initialized
    if (!initialized) {
      await nostrService.initialize()
      initialized = true
    }
    
    const fetchProfile = nostrService.getUserProfile(npub)
    // Timebox the profile fetch so we don't block rendering for too long
    const profile = await withTimeout(fetchProfile, PROFILE_TIMEOUT_MS, () => null)
    return profile
  } catch (error) {
    console.error(`Error fetching profile for ${npub}:`, error)
    return null
  }
}

export default async function ExamplesGrid(): Promise<React.JSX.Element> {
  // Fetch all profile data with timeouts
  const profilePromises = examples.map(example => getProfileData(example.npub))
  const profiles = await Promise.all(profilePromises)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {examples.map((example, index) => {
        const profile = profiles[index]
        const displayName = profile?.name || example.name
        const profileImage = profile?.picture
        const displayDescription = truncateDescription(profile?.about || example.fallbackDescription)
        
        return (
          <Link
            key={example.npub}
            href={`/${example.npub}`}
            className="group relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
          >
            <div className="flex items-center gap-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden relative aspect-square">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="40px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                <Image
                  src={example.localImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="40px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              )}
              {/* Fallback colored initials - will show if image fails to load */}
              <div className={`absolute inset-0 flex items-center justify-center ${example.fallbackColor} group-hover:opacity-80 transition-opacity`} style={{ zIndex: -1 }}>
                <span className="text-sm font-semibold text-white">{example.fallbackInitials}</span>
              </div>
            </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {displayName}
                </h3>
                <p className="text-xs text-gray-500">{displayDescription}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
