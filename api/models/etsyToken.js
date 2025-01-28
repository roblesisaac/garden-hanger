import { Model } from 'your-database-library';

class EtsyToken extends Model {
  static schema = {
    userId: String,
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    shopId: String
  };
}

export default EtsyToken; 