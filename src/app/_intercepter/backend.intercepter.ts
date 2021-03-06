import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS, } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// ユーザー名とパスワードを設定
const users = [
  {
    id: 1,
    username: 'test',
    password: 'test2020D',
    firstName: 'Test',
    lastName: 'User',
  },
];

@Injectable()
export class backendInterceptor implements HttpInterceptor {

  /**
   * バックエンド処理
   * @params requset
   * @params next
   * @return Observable
   */
  intercept(requset: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // リクエストの内容を格納
    const { url, method, headers, body } = requset;

    // 通知処理
    return of(null)
      .pipe(mergeMap(handleRoute))
      .pipe(materialize())
      .pipe(delay(500))
      .pipe(dematerialize<any>());

    /**
     * 指定したURLよって条件を分岐させる
     * @returns リクエスト
     */
    function handleRoute() {
      switch (true) {
        case url.endsWith('/users/authenticate') && method === 'POST':
          return authenticate();
        case url.endsWith('/users') && method === 'GET':
          return getUsers();
        default:
          next.handle(requset);
      }
    }

    /**
     * 入力しされたユーザー名、パスワードが設定済みのユーザー名、パスワードと一致するか確認
     * 異なる場合はエラーメッセージを表示、正しい場合は200 Statusを返す
     * @returns エラーメッセージもしくはStatus200のレスポンス
     */
    function authenticate(): any {
      const { username, password } = body;
      const user = users.find(
        (x) => x.username === username && x.password === password
      );

      if (!user) {
        return error('ユーザー名もしくはパスワードが正しくありません。');
      } else {
        return ok({
          id: user.id,
          username: user.firstName,
          lastName: user.lastName,
          token: 'fake-jwt-token',
        });
      }
    }

    /**
     * ログイン済みかチェックする
     * 未ログインの場合は401 Statusを返却、ログイン済みの場合は200 Statusを返却する
     * @returns any
     */
    function getUsers(): any {
      if (!isLoggedIn()) {
        return unauthorized();
      } else {
        return ok(users);
      }
    }

    /**
     * Status200のレスポンス処理を行う
     * @param body
     * @returns HttpResponse
     */
    function ok(body?: any): Observable<HttpResponse<any>> {
      return of(new HttpResponse({ status: 200, body }));
    }

    /**
     * HTTP Statusが401の場合、エラーメッセージを表示する
     * @returns Observable
     */
    function unauthorized(): Observable<never> {
      return throwError({ status: 401, error: { message: 'Unauthorised' } });
    }

    /**
     * エラーメッセージ処理を行う
     * @param message
     * @returns エラーメッセージ
     */
    function error(message: any): Observable<never> {
      return throwError({ error: message });
    }

    /**
     * ログインしているかどうかを確認
     * @return true or false
     */
    function isLoggedIn(): boolean {
      return headers.get('Authorization') === 'Bearer fake-jwt-token';
    }
  }
  
}

export let fakeBackendProvider = {
  // use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: backendInterceptor,
  multi: true
};