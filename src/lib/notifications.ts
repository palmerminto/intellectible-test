import { notifications } from '@mantine/notifications';

export function showAddedToEvidenceToast(sourceFilename: string, page: number) {
  notifications.show({
    title: 'Added to evidence',
    message: `${sourceFilename}, page ${page}`,
    color: 'green',
  });
}

export function showErrorToast(message: string) {
  notifications.show({
    title: 'Something went wrong',
    message,
    color: 'red',
  });
}
