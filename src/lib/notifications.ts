import { notifications } from '@mantine/notifications';

export function showAddedToDraftToast(sourceFilename: string, page: number) {
  notifications.show({
    title: 'Added to draft',
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
