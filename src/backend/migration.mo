// Migration: drops accessControlState (authorization removed).
// Expense type gains optional fields: recurring, recurringFrequency, tags.
// Must explicitly transform userData because Expense changed shape.
import Map "mo:core/Map";

module {
  // ── Old types (from previous version) ────────────────────────────────────

  type UserRole = { #admin; #guest; #user };

  type OldAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  // Old Expense — no optional fields.
  type OldExpense = {
    id : Text;
    amount : Float;
    categoryId : Text;
    date : Text;
    note : Text;
    paymentMethod : Text;
    createdAt : Int;
  };

  type CategoryInternal = {
    id : Text;
    name : Text;
    color : Text;
    budget : Float;
    createdAt : Int;
  };

  type MonthlyIncome = {
    month : Text;
    amount : Float;
  };

  type ShoppingItem = {
    id : Text;
    name : Text;
    category : Text;
    estimatedPrice : ?Float;
    bought : Bool;
    createdAt : Int;
    date : ?Text;
  };

  type AppSettingsInternal = {
    currency : Text;
    updatedAt : Int;
  };

  type OldUserData = {
    var expenses : Map.Map<Text, OldExpense>;
    var categories : Map.Map<Text, CategoryInternal>;
    var monthlyIncome : Map.Map<Text, MonthlyIncome>;
    var shoppingItems : Map.Map<Text, ShoppingItem>;
    var settings : ?AppSettingsInternal;
    var initialized : Bool;
  };

  // ── New types (matching new actor state) ─────────────────────────────────

  type NewExpense = {
    id : Text;
    amount : Float;
    categoryId : Text;
    date : Text;
    note : Text;
    paymentMethod : Text;
    createdAt : Int;
    recurring : ?Bool;
    recurringFrequency : ?Text;
    tags : ?Text;
  };

  type NewUserData = {
    var expenses : Map.Map<Text, NewExpense>;
    var categories : Map.Map<Text, CategoryInternal>;
    var monthlyIncome : Map.Map<Text, MonthlyIncome>;
    var shoppingItems : Map.Map<Text, ShoppingItem>;
    var settings : ?AppSettingsInternal;
    var initialized : Bool;
  };

  // ── Migration domain / codomain ───────────────────────────────────────────

  type OldActor = {
    accessControlState : OldAccessControlState;
    userData : Map.Map<Principal, OldUserData>;
  };

  type NewActor = {
    userData : Map.Map<Principal, NewUserData>;
  };

  public func run(old : OldActor) : NewActor {
    // Upgrade each user's OldUserData to NewUserData by migrating expenses.
    let newUserData = old.userData.map<Principal, OldUserData, NewUserData>(
      func(_principal, oldData) {
        let newExpenses = oldData.expenses.map<Text, OldExpense, NewExpense>(
          func(_id, e) {
            {
              id = e.id;
              amount = e.amount;
              categoryId = e.categoryId;
              date = e.date;
              note = e.note;
              paymentMethod = e.paymentMethod;
              createdAt = e.createdAt;
              recurring = null;
              recurringFrequency = null;
              tags = null;
            }
          }
        );
        {
          var expenses = newExpenses;
          var categories = oldData.categories;
          var monthlyIncome = oldData.monthlyIncome;
          var shoppingItems = oldData.shoppingItems;
          var settings = oldData.settings;
          var initialized = oldData.initialized;
        }
      }
    );
    // accessControlState is intentionally discarded.
    { userData = newUserData }
  };
};
