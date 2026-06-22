import { Center, Loader, Stack, Text } from '@mantine/core';

export default function Loading() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="sm">
        <Loader />
        <Text size="sm" c="dimmed">
          Loading workspace…
        </Text>
      </Stack>
    </Center>
  );
}
