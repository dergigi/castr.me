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
}

// Define the example data
const examples = [
  {
    npub: 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n',
    name: 'No Solutions',
    fallbackDescription: 'Demo Feed',
    fallbackInitials: 'NS',
    fallbackColor: 'bg-indigo-600'
  },
  {
    npub: 'npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx',
    name: 'ODELL',
    fallbackDescription: 'Bitcoin Podcast',
    fallbackInitials: 'OD',
    fallbackColor: 'bg-blue-600'
  },
  {
    npub: 'npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy',
    name: 'Marty Bent',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'MB',
    fallbackColor: 'bg-green-600'
  },
  {
    npub: 'npub1f4uyypghstsd8l4sxng4ptwzk6awfm3mf9ux0yallfrgkm6mj6es50r407',
    name: 'FLASH',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'FL',
    fallbackColor: 'bg-purple-600'
  },
  {
    npub: 'npub1m64hnkh6rs47fd9x6wk2zdtmdj4qkazt734d22d94ery9zzhne5qw9uaks',
    name: 'Ryan',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'RY',
    fallbackColor: 'bg-orange-600'
  },
  {
    npub: 'npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs',
    name: 'HODL',
    fallbackDescription: 'Bitcoin Podcast',
    fallbackInitials: 'HD',
    fallbackColor: 'bg-yellow-600'
  },
  {
    npub: 'npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn',
    name: 'yellow',
    fallbackDescription: 'Bitcoin Content',
    fallbackInitials: 'YL',
    fallbackColor: 'bg-pink-600'
  },
  {
    npub: 'npub1sk7mtp67zy7uex2f3dr5vdjynzpwu9dpc7q4f2c8cpjmguee6eeq56jraw',
    name: 'TFTC',
    fallbackDescription: 'Bitcoin Podcast',
    fallbackInitials: 'TF',
    fallbackColor: 'bg-red-600'
  }
]

// Create service instance
const nostrService = new NostrService()

// Initialize NDK connection
let initialized = false

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
    
    const profile = await nostrService.getUserProfile(npub)
    return profile
  } catch (error) {
    console.error(`Error fetching profile for ${npub}:`, error)
    return null
  }
}

export default async function ExamplesGrid(): Promise<React.JSX.Element> {
  // Fetch all profile data
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
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${example.fallbackColor} group-hover:opacity-80 transition-opacity`}>
                    <span className="text-sm font-semibold text-white">{example.fallbackInitials}</span>
                  </div>
                )}
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
