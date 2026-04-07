import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Expense type — kept at original shape to preserve stable variable compatibility.
  public type Expense = {
    id : Text;
    amount : Float;
    categoryId : Text;
    date : Text;
    note : Text;
    paymentMethod : Text;
    createdAt : Int;
  };

  public type ExpenseMeta = {
    tags : ?Text;
    receiptUrl : ?Text;
  };

  // Public Category type includes pinned.
  // pinned is stored separately in categoryPinnedByUser (not inside CategoryInternal)
  // to preserve stable variable compatibility with existing stored data.
  public type Category = {
    id : Text;
    name : Text;
    color : Text;
    budget : Float;
    pinned : ?Bool;
  };

  public type MonthlyIncome = {
    month : Text;
    amount : Float;
  };

  // Public AppSettings includes spending limits.
  // Limits are stored separately in userSpendingLimits to preserve stable var compatibility.
  public type AppSettings = {
    currency : Text;
    updatedAt : Int;
    dailyLimit : ?Float;
    weeklyLimit : ?Float;
  };

  // Internal AppSettings — kept WITHOUT limit fields to match existing stable data.
  type AppSettingsInternal = {
    currency : Text;
    updatedAt : Int;
  };

  public type SpendingLimits = {
    dailyLimit : ?Float;
    weeklyLimit : ?Float;
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

  public type IncomeSource = {
    id : Text;
    name : Text;
    color : Text;
    monthlyBudget : Float;
  };

  public type DebtRecord = {
    id : Text;
    description : Text;
    personName : Text;
    amount : Float;
    dueDate : ?Text;
    direction : Text; // "owe" | "owed"
    status : Text;    // "pending" | "paid"
    createdAt : Int;
  };

  public type BackupRecord = {
    name : Text;
    data : Text;
    createdAt : Int;
  };

  // CategoryInternal is kept WITHOUT pinned to preserve stable variable compatibility.
  // pinned is stored separately in categoryPinnedByUser.
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
    var settings : ?AppSettingsInternal;
    var initialized : Bool;
  };

  let userData = Map.empty<Principal, UserData>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userIncomeSources = Map.empty<Principal, Map.Map<Text, IncomeSource>>();
  // Expense metadata (tags + receiptUrl) stored separately.
  let expenseMetaByUser = Map.empty<Principal, Map.Map<Text, ExpenseMeta>>();
  // Category pinned state stored separately to avoid CategoryInternal migration.
  let categoryPinnedByUser = Map.empty<Principal, Map.Map<Text, Bool>>();
  // Spending limits stored separately to avoid AppSettingsInternal migration.
  let userSpendingLimits = Map.empty<Principal, SpendingLimits>();
  // Debt/loan tracker records per user.
  let userDebts = Map.empty<Principal, Map.Map<Text, DebtRecord>>();
  // Cloud backup records per user.
  let userBackups = Map.empty<Principal, Map.Map<Text, BackupRecord>>();

  // Helper: get or create user data
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

  func getPinnedMap(caller : Principal) : Map.Map<Text, Bool> {
    switch (categoryPinnedByUser.get(caller)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Text, Bool>();
        categoryPinnedByUser.add(caller, m);
        m;
      };
    };
  };

  // User Profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Expense CRUD
  public shared ({ caller }) func createExpense(expense : Expense) : async () {
    let data = getOrCreateUserData(caller);
    if (data.expenses.containsKey(expense.id)) { return };
    let newExpense = { expense with createdAt = Time.now() };
    data.expenses.add(expense.id, newExpense);
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    let data = getOrCreateUserData(caller);
    data.expenses.values().toArray();
  };

  public shared ({ caller }) func updateExpense(expense : Expense) : async () {
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
    let data = getOrCreateUserData(caller);
    if (not data.expenses.containsKey(expenseId)) {
      Runtime.trap("Expense with id " # expenseId # " does not exist");
    };
    data.expenses.remove(expenseId);
    switch (expenseMetaByUser.get(caller)) {
      case (?metaMap) { metaMap.remove(expenseId) };
      case (null) {};
    };
  };

  // Expense Metadata
  public shared ({ caller }) func setExpenseMeta(expenseId : Text, meta : ExpenseMeta) : async () {
    let metaMap = switch (expenseMetaByUser.get(caller)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Text, ExpenseMeta>();
        expenseMetaByUser.add(caller, m);
        m;
      };
    };
    metaMap.add(expenseId, meta);
  };

  public shared ({ caller }) func deleteExpenseMeta(expenseId : Text) : async () {
    switch (expenseMetaByUser.get(caller)) {
      case (?m) { m.remove(expenseId) };
      case (null) {};
    };
  };

  public query ({ caller }) func getExpenseMetaList() : async [(Text, ExpenseMeta)] {
    switch (expenseMetaByUser.get(caller)) {
      case (?m) { m.entries().toArray() };
      case (null) { [] };
    };
  };

  // Category CRUD
  public shared ({ caller }) func createCategory(category : Category) : async () {
    let data = getOrCreateUserData(caller);
    let pinnedMap = getPinnedMap(caller);
    let createdAt = switch (data.categories.get(category.id)) {
      case (?existing) { existing.createdAt };
      case (null) { Time.now() };
    };
    let cat : CategoryInternal = {
      id = category.id;
      name = category.name;
      color = category.color;
      budget = category.budget;
      createdAt = createdAt;
    };
    data.categories.add(category.id, cat);
    switch (category.pinned) {
      case (?true) { pinnedMap.add(category.id, true) };
      case (_) { pinnedMap.remove(category.id) };
    };
  };

  public query ({ caller }) func getCategories() : async [Category] {
    let data = getOrCreateUserData(caller);
    let pinnedMap = switch (categoryPinnedByUser.get(caller)) {
      case (?m) { m };
      case (null) { Map.empty<Text, Bool>() };
    };
    data.categories.values().toArray().map<CategoryInternal, Category>(func(c) {
      {
        id = c.id;
        name = c.name;
        color = c.color;
        budget = c.budget;
        pinned = pinnedMap.get(c.id);
      };
    });
  };

  public shared ({ caller }) func updateCategory(category : Category) : async () {
    let data = getOrCreateUserData(caller);
    let pinnedMap = getPinnedMap(caller);
    let updatedCat : CategoryInternal = {
      id = category.id;
      name = category.name;
      color = category.color;
      budget = category.budget;
      createdAt = switch (data.categories.get(category.id)) {
        case (?existing) { existing.createdAt };
        case (null) { Time.now() };
      };
    };
    data.categories.add(category.id, updatedCat);
    switch (category.pinned) {
      case (?true) { pinnedMap.add(category.id, true) };
      case (_) { pinnedMap.remove(category.id) };
    };
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    let data = getOrCreateUserData(caller);
    data.categories.remove(categoryId);
    switch (categoryPinnedByUser.get(caller)) {
      case (?m) { m.remove(categoryId) };
      case (null) {};
    };
  };

  // Monthly Income
  public shared ({ caller }) func setMonthlyIncome(income : MonthlyIncome) : async () {
    let data = getOrCreateUserData(caller);
    data.monthlyIncome.add(income.month, income);
  };

  public query ({ caller }) func getMonthlyIncome(month : Text) : async ?MonthlyIncome {
    let data = getOrCreateUserData(caller);
    data.monthlyIncome.get(month);
  };

  // App Settings — internal type omits limit fields; limits stored separately.
  public shared ({ caller }) func setAppSettings(settings : AppSettings) : async () {
    let data = getOrCreateUserData(caller);
    let internalSettings : AppSettingsInternal = {
      currency = settings.currency;
      updatedAt = Time.now();
    };
    data.settings := ?internalSettings;
    // Store limits separately
    userSpendingLimits.add(caller, {
      dailyLimit = settings.dailyLimit;
      weeklyLimit = settings.weeklyLimit;
    });
  };

  public query ({ caller }) func getAppSettings() : async ?AppSettings {
    let data = getOrCreateUserData(caller);
    switch (data.settings) {
      case (?s) {
        let limits = switch (userSpendingLimits.get(caller)) {
          case (?l) { l };
          case (null) { { dailyLimit = null; weeklyLimit = null } };
        };
        ?{
          currency = s.currency;
          updatedAt = s.updatedAt;
          dailyLimit = limits.dailyLimit;
          weeklyLimit = limits.weeklyLimit;
        };
      };
      case (null) { null };
    };
  };

  // Income Sources
  public shared ({ caller }) func saveIncomeSources(sources : [IncomeSource]) : async () {
    let sourcesMap = Map.empty<Text, IncomeSource>();
    for (src in sources.vals()) {
      sourcesMap.add(src.id, src);
    };
    userIncomeSources.add(caller, sourcesMap);
  };

  public query ({ caller }) func getIncomeSourcesList() : async [IncomeSource] {
    switch (userIncomeSources.get(caller)) {
      case (?sourcesMap) { sourcesMap.values().toArray() };
      case (null) { [] };
    };
  };

  // Debt / Loan Tracker
  public shared ({ caller }) func saveDebts(debts : [DebtRecord]) : async () {
    let debtsMap = Map.empty<Text, DebtRecord>();
    for (d in debts.vals()) {
      debtsMap.add(d.id, d);
    };
    userDebts.add(caller, debtsMap);
  };

  public query ({ caller }) func getDebts() : async [DebtRecord] {
    switch (userDebts.get(caller)) {
      case (?debtsMap) { debtsMap.values().toArray() };
      case (null) { [] };
    };
  };

  // Filter expenses by month
  public query ({ caller }) func getExpensesByMonth(month : Text) : async [Expense] {
    let data = getOrCreateUserData(caller);
    data.expenses.values().toArray().filter<Expense>(func(e) {
      e.date.startsWith(#text month);
    });
  };

  // Filter expenses by category
  public query ({ caller }) func getExpensesByCategory(categoryId : Text) : async [Expense] {
    let data = getOrCreateUserData(caller);
    data.expenses.values().toArray().filter<Expense>(func(e) {
      e.categoryId == categoryId;
    });
  };

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
        { categoryId = catId; categoryName = categoryName; total = total };
      }
    );

    let totalIncome = switch (data.monthlyIncome.get(month)) {
      case (?income) { income.amount };
      case (null) { 0.0 };
    };

    { month = month; totalExpenses = totalExpenses; totalIncome = totalIncome; categoryBreakdown = categoryBreakdown };
  };

  public query ({ caller }) func exportExpenses() : async [Expense] {
    let data = getOrCreateUserData(caller);
    data.expenses.values().toArray();
  };

  public shared ({ caller }) func resetUserData() : async () {
    userData.remove(caller);
    expenseMetaByUser.remove(caller);
    categoryPinnedByUser.remove(caller);
    userSpendingLimits.remove(caller);
    userDebts.remove(caller);
  };

  // Shopping List
  public shared ({ caller }) func createShoppingItem(item : ShoppingItem) : async () {
    let data = getOrCreateUserData(caller);
    if (data.shoppingItems.containsKey(item.id)) { return };
    let newItem = { item with createdAt = Time.now() };
    data.shoppingItems.add(item.id, newItem);
  };

  public query ({ caller }) func getShoppingItems() : async [ShoppingItem] {
    let data = getOrCreateUserData(caller);
    data.shoppingItems.values().toArray();
  };

  public shared ({ caller }) func updateShoppingItem(item : ShoppingItem) : async () {
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
    let data = getOrCreateUserData(caller);
    if (not data.shoppingItems.containsKey(itemId)) {
      Runtime.trap("Shopping item with id " # itemId # " does not exist");
    };
    data.shoppingItems.remove(itemId);
  };

  public shared ({ caller }) func toggleShoppingItemBought(itemId : Text, bought : Bool) : async () {
    let data = getOrCreateUserData(caller);
    let existingItem = switch (data.shoppingItems.get(itemId)) {
      case (?item) { item };
      case (null) { Runtime.trap("Shopping item with id " # itemId # " does not exist") };
    };
    let updatedItem = { existingItem with bought = bought; createdAt = existingItem.createdAt };
    data.shoppingItems.add(itemId, updatedItem);
  };

  public shared ({ caller }) func clearBoughtShoppingItems() : async () {
    let data = getOrCreateUserData(caller);
    let boughtItems = data.shoppingItems.entries().toArray().filter(
      func((_, item)) { item.bought }
    );
    for ((itemId, _) in boughtItems.vals()) {
      data.shoppingItems.remove(itemId);
    };
  };

  // Cloud Backup
  public shared ({ caller }) func saveBackup(name : Text, data : Text) : async () {
    let backupsMap = switch (userBackups.get(caller)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Text, BackupRecord>();
        userBackups.add(caller, m);
        m;
      };
    };
    let record : BackupRecord = { name = name; data = data; createdAt = Time.now() };
    backupsMap.add(name, record);
  };

  public query ({ caller }) func getBackupsList() : async [BackupRecord] {
    switch (userBackups.get(caller)) {
      case (?m) { m.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func deleteBackup(name : Text) : async () {
    switch (userBackups.get(caller)) {
      case (?m) { m.remove(name) };
      case (null) {};
    };
  };

};