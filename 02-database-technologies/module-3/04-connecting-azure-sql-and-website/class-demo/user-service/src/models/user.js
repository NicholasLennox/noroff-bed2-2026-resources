// The Users table already exists in Azure - we created it with SQL in the
// portal. This model describes that table rather than creating it, so every
// name here matches a column exactly.
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('User', {
    UserId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Username: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    Email: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    // No value needed on insert - the database fills it with SYSDATETIME().
    CreateAt: {
      type: Sequelize.DATE
    }
  }, {
    tableName: 'Users',
    timestamps: false
  })

  return User
}
