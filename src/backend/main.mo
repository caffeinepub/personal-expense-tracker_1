import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Expense = {
    id : Text;
    amount : Float;
    categoryId : Text;
    date : Text;
    note : Text;
    paymentMethod : Text;
    createdAt : Int;
  };

  public type Category = {
    id : Text;
    name : Text;
    color : Text;
    budget : Float;
  };

  public type MonthlyIncome = {
    month : Text;
    amount : Float;
  };

  public type AppSettings = {
    currency : Text;
    updatedAt : Int;
  };

  public type ShoppingItem = {
    id : Text;
    name : Text;
    category : Text;
    estimatedPrice : ?Float;
    bought : Bool;
    createdAt : Int;
    date : ?Text;
  };

  public type UserProfile = {
    name : Text;
  };

  type CategoryInternal = {
    id : Text;
    name : Text;
    color : Text;
    budget : Float;
    createdAt : Int;
  };

  type UserData = {
    var expenses : Map.Map<Text, Expense>;
    var categories : Map.Map<Text, CategoryInternal>;
    var monthlyIncome : Map.Map<Text, MonthlyIncome>;
    var shoppingItems : Map.Map<Text, ShoppingItem>;
    var settings : ?AppSettings;
    var initialized : Bool;
  };

  let userData = Map.empty<Principal, UserData>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper function to get or create user data with default categories
  func getOrCreateUserData(caller : Principal) : UserData {
    switch (userData.get(caller)) {
      case (?data) {
        if (not data.initialized) {
          seedDefaultCategories(data);
          data.initialized := true;
        };
        data;
      };
      case (null) {
        let newData : UserData = {
          var expenses = Map.empty<Text, Expense>();
          var categories = Map.empty<Text, CategoryInternal>();
          var monthlyIncome = Map.empty<Text, MonthlyIncome>();
          var shoppingItems = Map.empty<Text, ShoppingItem>();
          var settings = null;
          var initialized = false;
        };
        seedDefaultCategories(newData);
        newData.initialized := true;
        userData.add(caller, newData);
        newData;
      };
    };
  };

  // Seed default categories
  func seedDefaultCategories(data : UserData) {
    let defaultCategories = [
      { id = "food"; name = "Food"; color = "#FF6B6B"; budget = 0.0 },
      { id = "transport"; name = "Transport"; color = "#4ECDC4"; budget = 0.0 },
      { id = "entertainment"; name = "Entertainment"; color = "#45B7D1"; budget = 0.0 },
      { id = "bills"; name = "Bills"; color = "#FFA07A"; budget = 0.0 },
      { id = "shopping"; name = "Shopping"; color = "#98D8C8"; budget = 0.0 },
      { id = "health"; name = "Health"; color = "#F7DC6F"; budget = 0.0 },
      { id = "other"; name = "Other"; color = "#B19CD9"; budget = 0.0 },
    ];

    for (cat in defaultCategories.vals()) {
      let category : CategoryInternal = {
        id = cat.id;
        name = cat.name;
        color = cat.color;
        budget = cat.budget;
        createdAt = Time.now();
      };
      data.categories.add(cat.id, category);
    };
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Expense CRUD
  public shared ({ caller }) func createExpense(expense : Expense) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create expenses");
    };

    let data = getOrCreateUserData(caller);

    if (data.expenses.containsKey(expense.id)) {
      // Silently ignore duplicate IDs (idempotent)
      return;
    };

    let newExpense = {
      expense with createdAt = Time.now();
    };
    data.expenses.add(expense.id, newExpense);
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    let data = getOrCreateUserData(caller);
    data.expenses.values().toArray();
  };

  public shared ({ caller }) func updateExpense(expense : Expense) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update expenses");
    };

    let data = getOrCreateUserData(caller);

    if (not data.expenses.containsKey(expense.id)) {
      Runtime.trap("Expense with id " # expense.id # " does not exist");
    };

    let updatedExpense = {
      expense with createdAt = switch (data.expenses.get(expense.id)) {
        case (?existing) { existing.createdAt };
        case (null) { Time.now() };
      };
    };
    data.expenses.add(expense.id, updatedExpense);
  };

  public shared ({ caller }) func deleteExpense(expenseId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };

    let data = getOrCreateUserData(caller);

    if (not data.expenses.containsKey(expenseId)) {
      Runtime.trap("Expense with id " # expenseId # " does not exist");
    };

    data.expenses.remove(expenseId);
  };

  // Category CRUD
  public shared ({ caller }) func createCategory(category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create categories");
    };

    let data = getOrCreateUserData(caller);

    if (data.categories.containsKey(category.id)) {
      // Update existing instead of failing
      let updatedCategory : CategoryInternal = {
        id = category.id;
        name = category.name;
        color = category.color;
        budget = category.budget;
        createdAt = switch (data.categories.get(category.id)) {
          case (?existing) { existing.createdAt };
          case (null) { Time.now() };
        };
      };
      data.categories.add(category.id, updatedCategory);
      return;
    };

    let newCategory : CategoryInternal = {
      id = category.id;
      name = category.name;
      color = category.color;
      budget = category.budget;
      createdAt = Time.now();
    };
    data.categories.add(category.id, newCategory);
  };

  public query ({ caller }) func getCategories() : async [Category] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view categories");
    };

    let data = getOrCreateUserData(caller);
    let categories = data.categories.values().toArray();
    categories.map<CategoryInternal, Category>(func(c) {
      {
        id = c.id;
        name = c.name;
        color = c.color;
        budget = c.budget;
      };
    });
  };

  public shared ({ caller }) func updateCategory(category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update categories");
    };

    let data = getOrCreateUserData(caller);

    let updatedCategory : CategoryInternal = {
      id = category.id;
      name = category.name;
      color = category.color;
      budget = category.budget;
      createdAt = switch (data.categories.get(category.id)) {
        case (?existing) { existing.createdAt };
        case (null) { Time.now() };
      };
    };
    data.categories.add(category.id, updatedCategory);
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete categories");
    };

    let data = getOrCreateUserData(caller);
    data.categories.remove(categoryId);
  };

  // Monthly Income
  public shared ({ caller }) func setMonthlyIncome(income : MonthlyIncome) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set monthly income");
    };

    let data = getOrCreateUserData(caller);
    data.monthlyIncome.add(income.month, income);
  };

  public query ({ caller }) func getMonthlyIncome(month : Text) : async ?MonthlyIncome {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly income");
    };

    let data = getOrCreateUserData(caller);
    data.monthlyIncome.get(month);
  };

  // App Settings
  public shared ({ caller }) func setAppSettings(settings : AppSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set app settings");
    };

    let data = getOrCreateUserData(caller);
    let newSettings = {
      settings with updatedAt = Time.now();
    };
    data.settings := ?newSettings;
  };

  public query ({ caller }) func getAppSettings() : async ?AppSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view app settings");
    };

    let data = getOrCreateUserData(caller);
    data.settings;
  };

  // Filter expenses by month
  public query ({ caller }) func getExpensesByMonth(month : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    let data = getOrCreateUserData(caller);
    let allExpenses = data.expenses.values().toArray();
    allExpenses.filter<Expense>(func(e) {
      e.date.startsWith(#text month);
    });
  };

  // Filter expenses by category
  public query ({ caller }) func getExpensesByCategory(categoryId : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    let data = getOrCreateUserData(caller);
    let allExpenses = data.expenses.values().toArray();
    allExpenses.filter<Expense>(func(e) {
      e.categoryId == categoryId;
    });
  };

  // Monthly summary
  public type CategorySummary = {
    categoryId : Text;
    categoryName : Text;
    total : Float;
  };

  public type MonthlySummary = {
    month : Text;
    totalExpenses : Float;
    totalIncome : Float;
    categoryBreakdown : [CategorySummary];
  };

  public query ({ caller }) func getMonthlySummary(month : Text) : async MonthlySummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly summary");
    };

    let data = getOrCreateUserData(caller);
    let monthExpenses = data.expenses.values().toArray().filter(func(e) {
      e.date.startsWith(#text month);
    });

    var totalExpenses : Float = 0.0;
    let categoryTotals = Map.empty<Text, Float>();

    for (expense in monthExpenses.vals()) {
      totalExpenses := totalExpenses + expense.amount;

      let currentTotal = switch (categoryTotals.get(expense.categoryId)) {
        case (?total) { total };
        case (null) { 0.0 };
      };
      categoryTotals.add(expense.categoryId, currentTotal + expense.amount);
    };

    let categoryBreakdown = categoryTotals.entries().toArray().map(
      func((catId, total)) {
        let categoryName = switch (data.categories.get(catId)) {
          case (?cat) { cat.name };
          case (null) { "Unknown" };
        };
        {
          categoryId = catId;
          categoryName = categoryName;
          total = total;
        };
      }
    );

    let totalIncome = switch (data.monthlyIncome.get(month)) {
      case (?income) { income.amount };
      case (null) { 0.0 };
    };

    {
      month = month;
      totalExpenses = totalExpenses;
      totalIncome = totalIncome;
      categoryBreakdown = categoryBreakdown;
    };
  };

  // Export all expenses
  public query ({ caller }) func exportExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export expenses");
    };

    let data = getOrCreateUserData(caller);
    data.expenses.values().toArray();
  };

  // Reset all user data
  public shared ({ caller }) func resetUserData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reset their data");
    };

    userData.remove(caller);
  };

  // Shopping List Functions

  public shared ({ caller }) func createShoppingItem(item : ShoppingItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create shopping items");
    };

    let data = getOrCreateUserData(caller);

    if (data.shoppingItems.containsKey(item.id)) {
      // Silently ignore duplicate IDs (idempotent)
      return;
    };

    let newItem = {
      item with createdAt = Time.now();
    };
    data.shoppingItems.add(item.id, newItem);
  };

  public query ({ caller }) func getShoppingItems() : async [ShoppingItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view shopping items");
    };

    let data = getOrCreateUserData(caller);
    data.shoppingItems.values().toArray();
  };

  public shared ({ caller }) func updateShoppingItem(item : ShoppingItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update shopping items");
    };

    let data = getOrCreateUserData(caller);

    if (not data.shoppingItems.containsKey(item.id)) {
      Runtime.trap("Shopping item with id " # item.id # " does not exist");
    };

    let updatedItem = {
      item with createdAt = switch (data.shoppingItems.get(item.id)) {
        case (?existing) { existing.createdAt };
        case (null) { Time.now() };
      };
    };
    data.shoppingItems.add(item.id, updatedItem);
  };

  public shared ({ caller }) func deleteShoppingItem(itemId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete shopping items");
    };

    let data = getOrCreateUserData(caller);

    if (not data.shoppingItems.containsKey(itemId)) {
      Runtime.trap("Shopping item with id " # itemId # " does not exist");
    };

    data.shoppingItems.remove(itemId);
  };

  public shared ({ caller }) func toggleShoppingItemBought(itemId : Text, bought : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle shopping items");
    };

    let data = getOrCreateUserData(caller);

    let existingItem = switch (data.shoppingItems.get(itemId)) {
      case (?item) { item };
      case (null) { Runtime.trap("Shopping item with id " # itemId # " does not exist") };
    };

    let updatedItem = {
      existingItem with bought = bought;
      createdAt = existingItem.createdAt;
    };
    data.shoppingItems.add(itemId, updatedItem);
  };

  public shared ({ caller }) func clearBoughtShoppingItems() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear shopping items");
    };

    let data = getOrCreateUserData(caller);

    let boughtItems = data.shoppingItems.entries().toArray().filter(
      func((_, item)) {
        item.bought;
      }
    );

    for ((itemId, _) in boughtItems.vals()) {
      data.shoppingItems.remove(itemId);
    };
  };
};
