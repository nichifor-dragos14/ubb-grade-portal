import { Injectable, computed, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { NotificationDto, NotificationService } from '$backend/services';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  notifications = signal<NotificationDto[]>([]);
  unreadCount = computed(
    () =>
      this.notifications().filter((notification) => !notification.isRead).length
  );

  private connection: HubConnection | null = null;

  constructor(
    private readonly notificationApi: NotificationService,
    private readonly auth: AuthService
  ) {}

  connect() {
    if (this.connection || !this.auth.getToken()) {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => this.auth.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('notificationCreated', async () => {
      await this.refresh();
    });

    this.connection.onreconnected(async () => {
      await this.refresh();
    });

    void this.startConnection();
  }

  async refresh() {
    try {
      const notifications =
        await this.notificationApi.apiNotificationsGetAsync();

      this.notifications.set(notifications);
    } catch {
      return;
    }
  }

  async markAllAsRead() {
    if (this.unreadCount() === 0) {
      return;
    }

    try {
      await this.notificationApi.apiNotificationsReadAllPutAsync();

      this.notifications.update((items) =>
        items.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch {
      return;
    }
  }

  async disconnect() {
    if (!this.connection) {
      return;
    }

    await this.connection.stop();
    this.connection = null;
  }

  private async startConnection() {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Disconnected
    ) {
      return;
    }

    try {
      await this.connection.start();
      await this.refresh();
    } catch {
      setTimeout(() => {
        void this.startConnection();
      }, 2500);
    }
  }
}
