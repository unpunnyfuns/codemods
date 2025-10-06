import { Box } from 'native-base'

export function Example() {
  return (
    <>
      {/* With variant="container" */}
      <Box variant="container">Content</Box>

      {/* With variant="container" and disableTopRounding */}
      <Box variant="container" disableTopRounding>
        Content
      </Box>

      {/* With variant="container" and disableBottomRounding */}
      <Box variant="container" disableBottomRounding>
        Content
      </Box>

      {/* With variant="content" */}
      <Box variant="content">Content</Box>

      {/* With disableTopRounding only (no variant) */}
      <Box disableTopRounding>Content</Box>

      {/* With disableBottomRounding only (no variant) */}
      <Box disableBottomRounding>Content</Box>

      {/* With both disable props (no variant) */}
      <Box disableTopRounding disableBottomRounding>
        Content
      </Box>
    </>
  )
}
