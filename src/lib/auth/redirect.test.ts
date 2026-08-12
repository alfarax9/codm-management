import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_DESTINATION, resolveDestination, safeDestination } from './redirect'

describe('tujuan setelah verifikasi email', () => {
  it('tautan reset kata sandi menuju form kata sandi, bukan dasbor', () => {
    // Ini yang gagal sebelumnya: template email tidak membawa `next`, sehingga
    // pengguna dilempar ke /dashboard lalu dipantulkan ke /onboarding.
    assert.equal(resolveDestination('recovery'), '/akun/kata-sandi')
    assert.equal(resolveDestination('recovery', null), '/akun/kata-sandi')
  })

  it('tautan login biasa menuju dasbor', () => {
    assert.equal(resolveDestination('email'), DEFAULT_DESTINATION)
    assert.equal(resolveDestination(null), DEFAULT_DESTINATION)
  })

  it('menghormati next yang aman sebagai penimpa', () => {
    assert.equal(resolveDestination('email', '/scrims'), '/scrims')
    assert.equal(resolveDestination('recovery', '/settings'), '/settings')
  })

  it('mengabaikan next yang mengarah ke luar aplikasi', () => {
    assert.equal(resolveDestination('recovery', '//situs-lain.com'), '/akun/kata-sandi')
    assert.equal(resolveDestination('email', 'https://situs-lain.com'), DEFAULT_DESTINATION)
    assert.equal(resolveDestination('email', '/\\situs-lain.com'), DEFAULT_DESTINATION)
  })
})

describe('penyaringan jalur tujuan', () => {
  it('menerima jalur relatif', () => {
    assert.equal(safeDestination('/maps'), '/maps')
    assert.equal(safeDestination('/akun/kata-sandi'), '/akun/kata-sandi')
  })

  it('menolak alamat absolut dan protocol-relative', () => {
    for (const bad of [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      'http://evil.com',
      'evil.com',
    ]) {
      assert.equal(safeDestination(bad), null, `seharusnya ditolak: ${bad}`)
    }
  })

  it('menolak nilai kosong', () => {
    assert.equal(safeDestination(null), null)
    assert.equal(safeDestination(undefined), null)
    assert.equal(safeDestination(''), null)
  })
})
