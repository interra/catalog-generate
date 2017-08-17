/*
 * HomeConstants
 * Each action has a corresponding type, which the reducer knows and picks up on.
 * To avoid weird typos between the reducer and the actions, we save them as
 * constants here. We prefix them with 'yourproject/YourComponent' so we avoid
 * reducers accidentally picking up actions they shouldn't.
 *
 * Follow this format:
 * export const YOUR_ACTION_CONSTANT = 'yourproject/YourContainer/YOUR_ACTION_CONSTANT';
 */

export const LEAVE_COLLECTION = 'app/CollectionEntity/LEAVE_COLLECTION';
export const LOAD_COLLECTION = 'app/CollectionEntity/LOAD_COLLECTION';
export const LOAD_COLLECTION_SUCCESS = 'app/CollectionEntity/LOAD_COLLECTION_SUCCESS';
export const LOAD_COLLECTION_ERROR = 'app/CollectionEntity/LOAD_COLLECTION_ERROR';
export const LOAD_SCHEMA = 'app/CollectionEntity/LOAD_SCHEMA';
export const LOAD_SCHEMA_SUCCESS = 'app/CollectionEntity/LOAD_SCHEMA_SUCCESS';
export const LOAD_SCHEMA_ERROR = 'app/CollectionEntity/LOAD_SCHEMA_ERROR';
