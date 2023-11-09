export class Mediator {
    async saveSession(sessionName) {
        try {
          console.log('test3: ' + sessionName);
        } catch (error) {
          console.error(`Failed to save session: ${error}`);
        }
    }
}