/* Friendly messages for admin errors. */
(function () {
  window.AdminHelp = {
    msg: function (e) {
      var m = String((e && e.message) || e);
      if (/row-level security|violates row|permission denied|42501|not authorized|unauthorized/i.test(m)) {
        var who = window.__adminEmail ? ' You are signed in as ' + window.__adminEmail + '.' : ' You do not appear to be signed in.';
        return 'You are not allowed to change this.' + who + ' Your email must be in the admin list: run supabase/add-admin.sql in Supabase with this exact email. (' + m + ')';
      }
      return m;
    }
  };
})();
