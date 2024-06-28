export const getEntityModel=function getEntityModel(entityType) {
    const models = {
      Customer,
      Order,
      Lead,
      Amendment,
      User
    };
    return models[entityType];
  }
  