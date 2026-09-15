import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { sanitizeFreeText } from '../utils/validation.js';

const MAX_MESSAGE_LENGTH = 240;

export function createConnectionService({ store, rateLimiter, notificationService, analyticsService }) {
  return {
    sendRequest(requesterId, recipientId, message) {
      if (requesterId === recipientId) throw new ValidationError('You cannot connect with yourself.');
      if (store.isBlocked(requesterId, recipientId)) {
        throw new ForbiddenError('You cannot connect with this person.');
      }
      const recipientPrivacy = store.getPrivacySettings(recipientId);
      if (!recipientPrivacy.allow_connections) {
        throw new ForbiddenError('This person is not accepting connection requests right now.');
      }

      rateLimiter.consume(requesterId, 'connection_request');

      const cleanMessage = message ? sanitizeFreeText(message, MAX_MESSAGE_LENGTH) : null;
      const connection = store.createConnectionRequest(requesterId, recipientId, cleanMessage);
      if (connection.__duplicate) {
        throw new ConflictError('You already sent a connection request to this person.');
      }

      analyticsService.track('connection_requested', requesterId, { recipientId });
      notificationService.notify(recipientId, 'new_connection_request', {
        fromUserId: requesterId,
        message: cleanMessage,
        connectionId: connection.id,
      });
      return connection;
    },

    respond(connectionId, responderId, accept) {
      const connection = store.getConnectionById(connectionId);
      if (!connection) throw new NotFoundError('Connection request not found');
      if (connection.recipient_id !== responderId) {
        throw new ForbiddenError('You cannot respond to this request.');
      }
      if (connection.status !== 'pending') {
        throw new ConflictError('This request has already been answered.');
      }
      const status = accept ? 'accepted' : 'declined';
      const updated = store.updateConnectionStatus(connectionId, status);

      if (accept) {
        analyticsService.track('connection_accepted', responderId, { requesterId: connection.requester_id });
        notificationService.notify(connection.requester_id, 'connection_accepted', {
          byUserId: responderId,
          connectionId,
        });
      }
      return updated;
    },

    listPending(userId) {
      return store.listPendingForUser(userId);
    },
    listAccepted(userId) {
      return store.listAcceptedConnections(userId);
    },
    countAccepted(userId) {
      return store.countConnections(userId, 'accepted');
    },
  };
}
