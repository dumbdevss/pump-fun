"use client"

import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider } from "@apollo/client"

// Create Apollo Client instance
const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: "https://indexer.testnet.movementnetwork.xyz/v1/graphql",
  }),
})

interface ApolloWrapperProps {
  children: React.ReactNode
}

// Create a wrapper component to provide Apollo context
export default function ApolloWrapper({ children }: ApolloWrapperProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  )
}

// You would use this in your app layout or page like:
// 
// import ApolloWrapper from "./path/to/ApolloWrapper"
//
// export default function YourApp() {
//   return (
//     <ApolloWrapper>
//       {/* Your app components here */}
//       <TokenHolders token={yourToken} />
//     </ApolloWrapper>
//   )
// }